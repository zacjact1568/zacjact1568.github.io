---
title: 通过编译源码为 CentOS 7 升级 OpenSSL
slug: upgrading-openssl-for-centos-7-by-compiling-source-codes
date: 2019-03-23
---

这篇文章记录了我通过编译源码的方式在阿里云 CentOS 7 服务器上将 OpenSSL 从 `1.0.1e` 升级到 `1.1.0j` 的过程。

<!--more-->

# 起因

最近~~在 CentOS 7 上搭建 Minecraft 基岩版官方服务端~~，启动服务端的时候遇到了问题：

```
./bedrock_server: error while loading shared libraries: libssl.so.1.1: cannot open shared object file: No such file or directory
```

# 准备

{{< notice info >}}

以 `zack` 用户（`wheel` 用户组，即能通过 `sudo` 提权）登录服务器。

{{< /notice >}}

看起来是缺失 OpenSSL 库，但 `which openssl` 输出 `/usr/bin/openssl`，说明已安装。`openssl version` 输出的版本号为 `1.0.1e`，哦，需要的是 1.1，版本低了。在 `/usr/lib64` 中找到了对应的 so 文件也印证了这点：

【截图】

看来得给 OpenSSL 升下级。先使用包管理工具 `yum` 查看软件库中的最新版本：

```bash
yum list updates | grep openssl
```

![upgd-ossl-yum-list-update](https://image.zacjact1568.com/post/upgd-ossl-yum-list-update.jpg&post)

可以看到，软件库中支持的最高版本就是 `1.0.2k` 了，因此只能自己下载源码编译安装。

# 编译安装

打开 OpenSSL 官网源码下载[页面](https://www.openssl.org/source/)，写这篇文章时，1.1 版本最新的是 `1.1.0j`。右键拷贝链接，在服务器中下载并解压：

```bash
wget https://www.openssl.org/source/openssl-1.1.0j.tar.gz
tar -zxf openssl-1.1.0j.tar.gz
```

进入解压出的 `openssl-1.1.0j` 目录，可以看到一个 `INSTALL` 文件，是编译安装教程，在本地下载一份打开查看。

根据教程，开始编译：

```bash
./config
make
make test
```

出错了……

```
Can't locate Module/Load/Conditional.pm in @INC ...
```

网上查了下，可能是 Perl 的问题，仔细看了下教程，发现了编译要求：

```
To install OpenSSL, you will need:

  * A make implementation
  * Perl 5 with core modules (please read NOTES.PERL)
  * The perl module Text::Template (please read NOTES.PERL)
  * an ANSI C compiler
  * a development environment in the form of development libraries and C
    header files
  * a supported operating system
```

查看 `NOTES.PERL` 文件，里面给出了 Perl 版本的最低要求：

```
You MUST have at least Perl version 5.10.0 installed.
```

使用 `perl --version` 检查，版本是 `5.16.3`，符合要求。

又看到一句话：

```
- on Linux distributions based on Debian, the package 'perl' will install the core Perl modules as well, so you will be fine.
- on Linux distributions based on RPMs, you will need to install 'perl-core' rather than just 'perl'.
```

非常不幸，CentOS 确实是基于 RPMs 的 Linux 发行版，那还得安装 `perl-core` 这个包，所幸使用 `yum search perl-core` 命令搜索到了这个包，那就安装吧：

```bash
sudo yum install perl-core
```

这个文件中还提到了 OpenSSL 使用的 Perl 模块，就两个：`Test::More` 和 `Text::Template`。第一个（应该）属于核心 Perl 模块，也就是 `perl-core` 包里的，仅测试使用；第二个明确说了核心 Perl 模块里面没有，要自己安装，但又说为了防止“坑太大”，在源文件里包含了这个模块用来 fallback。那好吧，看来不用再安装了，直接运行测试吧：

```bash
make test
```

居然通过了，可以安装啦：

```bash
sudo make install
```

安装成功。根据教程，默认安装在 `/usr/local` 下的几个目录中。`openssl-1.1.0j` 目录就别删了，要卸载的话（应该）会用到。

{{< notice info >}}

后来才明白，其实不安装 `perl-core` 包也行的，只要不执行 `make test` 就行。需要的两个 Perl 模块，一个只用来测试（这就是为什么第一次运行测试会报错），一个源文件里已经包含了。

{{< /notice >}}

现在再执行 `which openssl`，输出 `/usr/local/bin/openssl`，说明环境变量已经改了——至少是添加到了优先级比较高的位置。但是执行 `openssl version` 却又提示找不到 `libssl.so.1.1`，也是醉了。还好在网上找到了解决方案，链接两个动态链接库到 `/usr/lib64` 中就行：

```bash
sudo ln -s /usr/local/lib64/libssl.so.1.1 /usr/lib64/
sudo ln -s /usr/local/lib64/libcrypto.so.1.1 /usr/lib64/
```

然后执行 `openssl version`，成功输出版本号 `1.1.0j`。

# 参考资料

- [CentOS 7 OpenSSL安装 - Jc0803kevin的专栏 - CSDN博客](https://blog.csdn.net/jc0803kevin/article/details/79821168)

# 后记

这篇文章是在 CentOS 7 上搭 Minecraft 基岩版官方服务端的时候写的，没想到坑这么多，OpenSSL 版本低的问题解决了，又来个 glibc 和 glibcxx，看到网上说升级 glibc 很危险，但还是准备试一试，然而 configure 的时候就报错了，说很多依赖都没有，看着这一大堆 `no` 头大，心一横把系统重装成 Ubuntu 18.04 了，直接就能启动服务器了，没有任何报错，也怪不得网页上要把“FOR LINUX”改成“FOR UBUNTU”了🙄。