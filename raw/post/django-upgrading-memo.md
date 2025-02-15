---
title: "Django 更新记录"
date: "2020-02-07"
excerpt: "我将自己 Life 网站的 Django 框架由 2.0.6 更新到 2.2.9，其中遇到了一些坑，在此记录一下。"
---

我将自己 Life 网站的 Django 框架由 2.0.6 更新到 2.2.9，其中遇到了一些坑，在此记录一下。 

# 版本

目前 Django 的最新版本是 3.0.4，但为什么我选择了 2.2.9 呢？在[下载页面](https://www.djangoproject.com/download/)可以找到如下图片：

![](/images/django-upgrading-memo/versions-support-time.jpg)

可以看到，2.2 系列是一个 LTS（Long Term Support，长期支持）版本，可以保证在很长一段时间内都能得到官方的更新，扩展支持时间到了 2022 年。服务器软件一般是以稳定为主，因此不会去追求最新版本，如果更新这么简单，我就不会写这篇文章了。但随着时间流逝，可能会有一些新的安全问题出现，这就需要官方对此发布补丁，那么我们自然希望使用的软件版本能接受较长时间的更新支持。2.2 系列最新的子版本是 2.2.9，就它了。

# 本地

我使用 Python 虚拟环境开发。进入虚拟环境，运行以下命令更新 Django：

```
pip install --upgrade Django==2.2.9
```

然而，启动 Django 时报错：

```
django.core.management.base.SystemCheckError: SystemCheckError: System check identified some issues:

ERRORS:
?: (urls.E007) The custom handler403 view 'status.views.forbidden' does not take the correct number of arguments (request, exception).
?: (urls.E007) The custom handler404 view 'status.views.page_not_found' does not take the correct number of arguments (request, exception).
```

是我自定义的 403、404 页面的两个 View 函数参数数量不对，原来只有一个 request 参数，在后面加上 exception 参数即可。

成功运行。

# 服务器

## 更新 Python

登录服务器，`git pull` 拉取代码，进入虚拟环境，更新 Django 的时候却发现报错：

```
No matching distribution found for Django==2.2.9
```

原因是 Django 2.1 取消了对 Python 3.4 的支持，而我本地是 3.7，服务器上正是 3.4。这个很简单，我的服务器是 CentOS 7，可以通过 RPM 包管理器 yum 直接安装 3.6，执行：

```
sudo yum install python36
```

这样也会将 pip 一并安装上。

多说一点，由于我之前的 3.4 也是通过 yum 安装的，此次安装 3.6 并不会覆盖之前的 3.4（但是会将其升级，我的就由 3.4.9 更新到了 3.4.10，不知道这样是啥意思），只是在 `/usr/bin` 中的符号链接文件 `python3` 由 `python3.4` 指向了 `python3.6`：

```
[zack@vultr ~]$ ls /usr/bin/python3* -l
lrwxrwxrwx 1 root root     9 2月   6 06:42 /usr/bin/python3 -> python3.6
-rwxr-xr-x 2 root root 11312 10月  4 19:16 /usr/bin/python3.4
-rwxr-xr-x 2 root root 11312 10月  4 19:16 /usr/bin/python3.4m
-rwxr-xr-x 2 root root 11408 8月   7 2019 /usr/bin/python3.6
-rwxr-xr-x 2 root root 11408 8月   7 2019 /usr/bin/python3.6m
```

也就是说，运行 `python3` 命令时，使用的是新的 3.6 了，实现了替换：

```
[zack@vultr ~]$ python3 -V
Python 3.6.8
[zack@vultr ~]$ python3.4 -V
Python 3.4.10
[zack@vultr ~]$ python3.6 -V
Python 3.6.8
```

由于服务器上该项目的 Python 虚拟环境基于 3.4，要更新到 3.6，直接删除旧的虚拟环境，重新创建一个，重新安装各种依赖，包括更新的 Django。

## 更新 SQLite

在新虚拟环境中运行 `python manage.py collectstatic` 收集静态文件时，报错：

```
django.core.exceptions.ImproperlyConfigured: SQLite 3.8.3 or later is required (found 3.7.17).
```

又是 SQLite 版本低了，查了一下，在 Django 2.2 中，SQLite 的最低支持版本由 3.7.15 增加到了 3.8.3。

首先查看服务器自带的 SQLite 版本：

```
[zack@vultr ~]$ sqlite3 --version
3.7.17 2013-05-20 00:56:22 118a3b35693b134d56ebd780123b7fd6f1497668
```

Python 调用的版本：

```
[zack@vultr ~]$ python3
Python 3.6.8 (default, Aug  7 2019, 17:28:10)
[GCC 4.8.5 20150623 (Red Hat 4.8.5-39)] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import sqlite3
>>> sqlite3.sqlite_version
'3.7.17'
```

可以看到，两者一致，都是 3.7.17。

开始想到用 yum 更新，执行 `yum list sqlite` 检查更新，只有一个不痛不痒的小版本更新，更新完后还是 3.7.17，于是，只有一个办法，就是从源码编译安装。其实我不太喜欢这样的方式，觉得不好应对将来可能的卸载。

首先下载 SQLite 源码，目前[官网](https://www.sqlite.org/download.html)最新版本是 3.31.1，但以防万一，还是用与本地相同的版本 3.27.2 吧。要下载旧版本，需要自己推算下载链接，例如 3.31.1 的链接是

`https://www.sqlite.org/2020/sqlite-autoconf-3310100.tar.gz`

那么 3.27.2 就是

`https://www.sqlite.org/2019/sqlite-autoconf-3270200.tar.gz`

在服务器上用 wget 下载，然后解压即可。

编译前，确保已安装 gcc，若未安装，执行 `sudo yum install gcc` 安装。

进入解压后的源码目录，执行以下命令：

```bash
# 生成配置文件
./configure
# 编译
make
# 安装
sudo make install
```

此时，SQLite 被安装在了 `/usr/local` 中，其中，二进制可执行文件在 `bin` 中，动态链接库文件在 `lib` 中，头文件在 `include` 中，通过自己编译安装的软件一般都放在这里，也可在 `./configure` 的时候通过 `--prefix` 参数指定。作为对比，系统自带的 SQLite 的这些文件在 `/usr` 的对应目录中。在 `PATH` 环境变量中，`/usr/local/bin` 是默认放在 `/usr/bin` 之前的，也就是说，在执行 `sqlite3` 命令时，系统首先搜索到的是 `/usr/local/bin/sqlite3`，就会执行新安装的 SQLite。测试一下：

```
[zack@vultr ~]$ sqlite3 --version
3.27.2 2019-02-25 16:06:06 bd49a8271d650fa89e446b42e513b595a717b9212c91dd384aab871fc1d0f6d7
```

已成功更新，但查看 Python 调用的版本，会发现还是原来的 3.7.17，这是因为，Python 是通过动态链接库的方式调用 SQLite 的，而系统默认的动态链接库搜索目录只有 `/lilb` 和 `/usr/lib`，以及 `/etc/ld.so.conf` 配置文件中列出的目录，不包含 `/usr/local/lib`，所以搜索不到刚安装的 SQLite 动态链接库文件。

因此，方法有两个，一是重新编译安装 Python，将 `/usr/local/lib` 添加到链接时的库搜索路径上：

```bash
LD_RUN_PATH=/usr/local/lib ./configure LDFLAGS="-L/usr/local/lib" CPPFLAGS="-I/usr/local/include"
LD_RUN_PATH=/usr/local/lib make
sudo make install
```

这样编译成的 Python 就知道到该目录去搜索 SQLite 的动态链接库了。

{# {"type": "notice", "level": "info", "content": "事实上，由于 gcc 在编译时默认就会在 `/usr/local/include` 中搜索头文件，因此，我觉得上文命令中的 `CPPFLAGS=\"-I/usr/local/include\"` 可以不加，然而这段命令是抄来的，没测试过，也不能妄下定论。"} #}

由于已经安装过 Python 了，所以我使用了第二种方法——添加系统动态链接库搜索路径。上文提到过，除 `/lilb` 和 `/usr/lib` 外，系统还会搜索 `/etc/ld.so.conf` 中存放的路径，看看它里面是什么：

```
[zack@vultr ~]$ cat /etc/ld.so.conf
include ld.so.conf.d/*.conf
```

指向了 `ld.so.conf.d` 目录下的 `conf` 后缀文件，这样是让每个软件的动态链接库路径存放在各自的文件中，方便管理吧。于是在该目录下新建一个 `local.conf` 文件，存放文本 `/usr/local/lib`，可简写为：

```
sudo echo "/usr/local/lib" > /etc/ld.so.conf.d/local.conf
```

然后执行

```
sudo ldconfig
```

该命令会刷新动态链接库临时缓冲文件 `/etc/ld.so.cache`。

然后检查下是否添加成功：

```
[zack@vultr ~]$ ldconfig -p | grep sqlite
	libsqlite3.so.0 (libc6,x86-64) => /usr/local/lib/libsqlite3.so.0
	libsqlite3.so.0 (libc6,x86-64) => /lib64/libsqlite3.so.0
	libsqlite3.so (libc6,x86-64) => /usr/local/lib/libsqlite3.so
```

完成。检查下 Python 是否调用最新的 SQLite：

```
[zack@vultr ~]$ python3
Python 3.6.8 (default, Aug  7 2019, 17:28:10)
[GCC 4.8.5 20150623 (Red Hat 4.8.5-39)] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>> import sqlite3
>>> sqlite3.sqlite_version
'3.27.2'
```

成功！可以愉快地使用新版 Django 了。

其实还有一种方式，在运行 Django 之前执行如下命令添加环境变量：

```
export LD_LIBRARY_PATH=/usr/local/lib
```

但是像这样每次登录之前都要执行一次的方式似乎并不适合服务器程序。

事实上，这些都在安装 SQLite 时，执行 `sudo make install` 的输出中提到过：

```
----------------------------------------------------------------------
Libraries have been installed in:
   /usr/local/lib

If you ever happen to want to link against installed libraries
in a given directory, LIBDIR, you must either use libtool, and
specify the full pathname of the library, or use the '-LLIBDIR'
flag during linking and do at least one of the following:
   - add LIBDIR to the 'LD_LIBRARY_PATH' environment variable
     during execution
   - add LIBDIR to the 'LD_RUN_PATH' environment variable
     during linking
   - use the '-Wl,-rpath -Wl,LIBDIR' linker flag
   - have your system administrator add LIBDIR to '/etc/ld.so.conf'

See any operating system documentation about shared libraries for
more information, such as the ld(1) and ld.so(8) manual pages.
----------------------------------------------------------------------
```

# 参考资料

- [Django 2.1 release notes | Django documentation | Django](https://docs.djangoproject.com/en/3.0/releases/2.1/)
- [Django 2.2 release notes | Django documentation | Django](https://docs.djangoproject.com/en/3.0/releases/2.2/)
- [testing a Django 2.2 website with SQLite3 on CentOS 7 | DjaoDjin](http://www.djaodjin.com/blog/django-2-2-with-sqlite-3-on-centos-7.blog.html)
- [django-2.2.4 不再支持 sqlite-3.8.3 - 蒋乐兴的玫瑰园](https://www.sqlpy.com/blogs/books/2/chapters/15/articles/77)
- [在CentOS7上升级SQLite，并让Python使用新版SQLite - ETOC](https://e2c.net/2019/06/21/147.html)
- [LINUX下默认搜索头文件及库文件的路径 - 简书](https://www.jianshu.com/p/3eb25114576e)