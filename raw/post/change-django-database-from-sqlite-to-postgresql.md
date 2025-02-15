---
title: "Django 数据库由 SQLite 更换为 PostgreSQL"
date: "2023-05-30"
excerpt: "SQLite 是单文件的数据库，如果没有特别配置，Django 默认使用该数据库，在项目根目录下生成的 `db.sqlite3` 就是所使用的 SQLite 数据库文件。它的优点是简便好用，不需要费劲去配一大堆用户、权限、访问方式之类的，但缺点是数据、并发连接多了性能可能会受影响，也不够灵活。虽然现在我的网站还远远没有到达这个级别，但依然准备将其数据库更换为 PostgreSQL，让它成为一个标准的服务器程序。"
---

SQLite 是单文件的数据库，如果没有特别配置，Django 默认使用该数据库，在项目根目录下生成的 `db.sqlite3` 就是所使用的 SQLite 数据库文件。它的优点是简便好用，不需要费劲去配一大堆用户、权限、访问方式之类的，但缺点是数据、并发连接多了性能可能会受影响，也不够灵活。虽然现在我的网站还远远没有到达这个级别，但依然准备将其数据库更换为 PostgreSQL，让它成为一个标准的服务器程序。

首先说一下我的服务器环境：

- CentOS 7
- Python 3.6
- Django 3.2

# 安装 PostgreSQL 并配置

Django 3.2 最低要求 PostgreSQL 9.6，而 CentOS 7 软件库里面最高只有 9.2 了（使用 `yum search postgresql` 搜索得出的结果），但好在 PostgreSQL 官方还在继续支持 CentOS 7，添加一个它提供的仓库，可以安装到最新的 15：

```sh
sudo yum install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-7-x86_64/pgdg-redhat-repo-latest.noarch.rpm
sudo yum install -y postgresql15-server
```

{# {"type": "notice", "level": "info", "content": "命令里面的 `-y` 是为了安装时的询问都回答 yes，比如导入 GPG key 会询问 `Is this ok [y/N]: y`"} #}

初始化 PostgreSQL 数据库：

```sh
sudo /usr/pgsql-15/bin/postgresql-15-setup initdb
```

启动 PostgreSQL 并启用 Systemd 开机自启：

```sh
sudo systemctl enable postgresql-15
sudo systemctl start postgresql-15
```

先使用初始化时创建好的一个 PostgreSQL 角色 `postgres` 登录，以使用交互式命令 `psql`：

```sh
sudo -u postgres psql
```

{# {"type": "notice", "level": "info", "content": "这里需要说明的是，PostgreSQL 的角色（Role）不同于 Linux 用户，但如果它们同名，就无需特别指定。例如上述命令 `sudo -u postgres` 使用安装时创建好的一个 Linux 用户 `postgres` 来执行 `psql` 这个命令，表示使用 PostgreSQL 的同名角色 `postgres` 来登录。"} #}

可以看到命令行变成了这样，表示成功进入了 `psql`：

```
psql (9.2.24, server 15.3)
WARNING: psql version 9.2, server version 15.0.
         Some psql features might not work.
Type "help" for help.

postgres=#
```

`postgres` 是 PostgreSQL 的一个管理员角色，需要使用它来新建 Django 使用的角色和数据库。

{# {"type": "notice", "level": "info", "content": "`=#` 前面显示的 `postgres` 表示当前打开了名为 `postgres` 的数据库，而不是表示登录的角色名。"} #}

使用 `psql` 创建一个名为 `life` 的角色，赋予登录权限并设置密码：

```
CREATE ROLE life;
ALTER ROLE life WITH LOGIN;
ALTER ROLE life WITH PASSWORD '<密码>';
```

创建一个名为 `life` 的数据库，赋予角色 `life` 操控该数据库的权限，以及该数据库的所有权：

```
CREATE DATABASE life;
GRANT ALL PRIVILEGES ON DATABASE life TO life;
ALTER DATABASE life OWNER TO life;
```

好了，现在可以使用一些命令来确认刚才的操作：

- `\l`：列出当前所有数据库
- `\du`：列出当前所有角色
- `\c life`：切换到 `life` 数据库，然后
  - `\dt`：列出所有表，此时当然输出 `No relations found.`，因为还没建表
- `\q`：退出 `psql`

也可以重新以 `life` 角色登录 `life` 数据库：

```sh
psql -U life -d life -h 127.0.0.1
```

输入刚才设置的密码。

添加 `-h 127.0.0.1` 参数是为了使用了 host 的方式来连接，而不是默认的 Unix 套接字。后者使用 peer 的方式来认证，会得到一个错误：

```
psql: connection to server on socket "/var/run/postgresql/.s.PGSQL.5432" failed: FATAL:  Peer authentication failed for user "life"
```

当然貌似通过一些设置也可以通过 peer 认证，我也没继续研究下去了。

# Django 导出 SQLite 数据

很简单，直接使用 Django 的 `dumpdata` 这个命令即可。服务端进入项目根目录执行：

```sh
python manage.py dumpdata -o life.json
```

此操作将数据库中所有数据序列化为 JSON 格式，输出到 `life.json` 这个文件中。

当然事实上并不会有这么顺利，这样序列化的话，后面在导入 PostgreSQL 的时候，我遇到了如下问题：

```
psycopg2.errors.UniqueViolation: duplicate key value violates unique constraint "auth_permission_content_type_id_codename_01ab375a_uniq"
DETAIL:  Key (content_type_id, codename)=(5, add_contenttype) already exists.
```

需要以自然键重新导出，加两个参数即可：

```sh
python manage.py dumpdata --natural-primary --natural-foreign -o life.json
```

当然貌似也可以通过清空新数据库中的 ContentType 来解决，这我就没试了。

很好运，我也只是遇到了这一个问题。

# 修改 Django 数据库配置及连接 PostgreSQL

我的想法是，本地开发依然使用 SQLite，而服务器生产环境就切换为 PostgreSQL。由于我网站的开发环境和生产环境共享同一套代码，所以需要作个判断，我的方式是在服务器上的项目根目录放一个 `production.py`，里面存放上面新建的 PostgreSQL 角色 `life` 的密码（以及其他生产环境下的 key 之类的），在 `settings.py` 去尝试 `import` 这个文件，如果成功那么说明在服务器上，顺便可以拿到这个密码。

```py
try:
    from production import postgresql_password
    # 生产环境
    debug_mode = False
except ImportError:
    # 开发环境
    debug_mode = True

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    } if debug_mode else {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'life',
        'USER': 'life',
        'PASSWORD': postgresql_password,
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}
```

上述 PostgreSQL 配置是 Django 文档中给出的示例，可以看到也是通过 host 的方式来连接 PostgreSQL 的。

此外，还需要安装 `psycopg2` 这个 Python 库，**我理解**它是 PostgreSQL 的 Python 接口，通过该接口可以在 Python 程序中对 PostgreSQL 进行操作：

```sh
pip install psycopg2
```

注意在此之前还需要安装 PostgreSQL 和 Python 的开发库：

```sh
sudo yum install postgresql-devel python3-devel
```

如果没有 `postgresql-devel` 的话，安装 `psycopg2` 时的编译过程会报出诸如 `Error: pg_config executable not found` 的错误；如果没有 `python3-devel` 则会报出诸如 `致命错误：Python.h：没有那个文件或目录` 的错误。

`psycopg2` 安装的是最新版本 2.9.6，虽然 pip 会自动 fallback 去尝试更低的版本，然后在某一个低版本安装成功，但自然版本是越新越好了。

或者直接安装编译好的包 `psycopg2-binary`，但貌似并不推荐：

> The binary package is a practical choice for development and testing but in production it is advised to use the package built from sources.

然后测试下 Django 对 PostgreSQL 的连接吧：

```sh
python manage.py check --database default
```

如果看到输出

```
System check identified no issues (0 silenced).
```

就说明连接成功啦，至少上面的配置是没问题的。

# Django 导入数据到 PostgreSQL

先使用 Django 的 `migrate` 命令创建数据库表结构：

```sh
python manage.py migrate
```

再使用 Django 的 `loaddata` 命令导入此前导出的序列化数据：

```sh
python manage.py loaddata life.json
```

我第一次导入的时候，遇到了上面提到的 `UniqueViolation` 问题，添加自然键参数重新导出，有类似 `Installed xxx object(s) from 1 fixture(s)` 的输出，就成功了。

然后尝试查看下数据，使用 `psql` 登录数据库后，执行 `\d <表名>` 查看表结构，却得到了以下错误：
  
```
ERROR:  column c.relhasoids does not exist
LINE 1: ..., c.relhasindex, c.relhasrules, c.relhastriggers, c.relhasoi...
                                                             ^
```

网上说是 `psql` 版本太旧的原因，上文进入 `psql` 有提示 `WARNING: psql version 9.2, server version 15.0. Some psql features might not work.` 也佐证了这一点。但 `psql` 应该是随 PostgreSQL 一起安装的，既然 PostgreSQL 都是最新版，为啥 `psql` 还是旧版呢？也可以根据 [这个链接](https://www.cnblogs.com/lqqgis/p/15075657.html) 提到的更改一下 `psql` 链接的可执行文件，应该就行了。但我也没试过，因为可以用后文提到的远程访问。

然后启动 Django，看了看一切都没问题，说明数据库更换已完美完成，比我想象中顺利。

# Bonus：远程访问 PostgreSQL

如果有在本地查看服务器数据的需求，则需要配置客户端远程访问 PostgreSQL。首先需要修改 `/var/lib/pgsql/15/data/` 目录下的两个配置文件：

第一个：`postgresql.conf`

```
#listen_addresses = 'localhost'
```

改为：

```
listen_addresses = '*'
```

表示监听的 IP 地址由默认的本地回环（`localhost`）改为所有（`*`）。

第二个：`pg_hba.conf`

在最下面添加一行：

```
host    life            life            0.0.0.0/0               scram-sha-256
```

表示 host 方式连接，角色为 `life`，数据库为 `life`，允许的 IPv4 地址为所有（`0.0.0.0/0`），密码验证方法为 `scram-sha-256`。

{# {"type": "notice", "level": "info", "content": "`scram-sha-256` 这个密码验证方法是 PostgreSQL 最新的，老版本用的是 `md5`。角色的密码经散列运算后放在 `pg_authid` 这张表里面，可以打印里面的数据看看，`rolpassword` 这一列是不是有 `SCRAM-SHA-256` 的前缀，用上文提到的创建密码方式，的确是符合的，说明可以使用这种方法验证。"} #}

修改完这两个配置文件后，重启 PostgreSQL：

```sh
sudo systemctl restart postgresql-15
```

还有最重要的一步，修改系统防火墙配置，增加允许 PostgreSQL 的默认端口 5432。

```sh
sudo firewall-cmd --add-port=5432/tcp --permanent
sudo firewall-cmd --reload
```

{# {"type": "notice", "level": "info", "content": "有的 Linux 发行版没有默认开启防火墙，比如记得以前用过 Ubuntu 就没有，那这一步就可以省略掉。"} #}

我使用 PyCharm 自带的数据库客户端去连接：

![](/images/change-django-database-from-sqlite-to-postgresql/remote-access-pycharm.jpg)

完工！

# 参考资料

- [PostgreSQL: Linux downloads (Red Hat family)](https://www.postgresql.org/download/linux/redhat/)
- [配置 | Django 文档 | Django](https://docs.djangoproject.com/zh-hans/3.2/ref/settings/)
- [数据库 | Django 文档 | Django](https://docs.djangoproject.com/zh-hans/3.2/ref/databases/)
- [python - how can I check database connection to mysql in django - Stack Overflow](https://stackoverflow.com/questions/32098797/how-can-i-check-database-connection-to-mysql-in-django)
- [Django更换数据库和迁移数据方案 - 程序设计实验室 - 博客园](https://www.cnblogs.com/deali/p/16884908.html)
- [Django 从SQLite迁移到PostgreSQL | Not determined yet](https://counter2015.com/2020/01/15/django-migration-sqlite-to-postgre/)
- [Django SQLite to PostgreSQL database migration | by Hemanth S P | DjangoTube: | Medium](https://medium.com/djangotube/django-sqlite-to-postgresql-database-migration-e3c1f76711e1)
- [如何在CentOS 7安装PostgreSQL | myfreax](https://www.myfreax.com/how-to-install-postgresql-on-centos-7/)
- [二. 连接PostgreSQL - 简书](https://www.jianshu.com/p/f246dc45e6dc)
- [PostgreSQL: Documentation: 15: 20.3. Connections and Authentication](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [PostgreSQL: Documentation: 15: 21.1. The pg_hba.conf File](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html)
- [PostgreSQL: Documentation: 15: 21.5. Password Authentication](https://www.postgresql.org/docs/current/auth-password.html)