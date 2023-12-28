---
title: 通过编译源码为 CentOS 7 安装 Python 3.10
slug: installing-python-3-10-for-centos-7-by-compiling-source-codes
date: 2023-12-28
---

我的网站目前使用的 Django 版本是 3.2 LTS，Django 对该版本的支持即将在明年初到期，于是准备将它升级到下一个 LTS 版本——4.2。然而我的服务器上安装的 Python 还是老旧的 3.6，从 Django 4 开始，该版本的 Python 已经不被支持，所以需要先做一个新版本 Python 的安装，特此记录。

<!--more-->

我的服务器系统是 CentOS 7，这也是一个早已结束支持的操作系统。系统的 RPM 包管理器 `yum` 能搜索到的 Python 版本最高是 3.6.8，这也是我现在正在使用的版本，所以要想使用更高版本的 Python，只能自行下载源码编译。

Python 官网 [下载页面](https://www.python.org/downloads/) 显示目前 3.10 版本已经处于 security 维护状态，3.11 和 3.12 还在 bugfix，因此虽然目前最高稳定版是 3.12.1，我还是决定只更新到 3.10 最新的 3.10.13，感觉会比较稳定吧。

遵循 [官方文档](https://devguide.python.org/getting-started/setup-building/#install-dependencies)，先使用 `yum` 安装一些必要依赖：

```sh
sudo yum install yum-utils
sudo yum-builddep python3
```

下载 Python 3.10.13 的源码并解压：

```sh
wget https://www.python.org/ftp/python/3.10.13/Python-3.10.13.tgz
tar xf Python-3.10.13.tgz
```

{{< notice note >}}

`tar` 命令的参数中，`x` 表示解压操作，`f` 表示指定压缩包的文件名。

{{< /notice >}}

进入解压后的文件夹，配置：

```sh
./configure --enable-optimizations
```

`--enable-optimizations` 是应用优化，如果不加这个参数，在输出的末尾会提示建议添加，故先加上试试。

编译：

```sh
make
```

提示：

```
Could not build the ssl module!
Python requires a OpenSSL 1.1.1 or newer
```

系统 OpenSSL 版本过低，需要先升级到 1.1.1。事实上在执行 `./configure` 的输出的靠后位置已有相关提示，可以仔细看看。

由于 EPEL 里面已经有 OpenSSL 1.1.1 了，事实上是不需要像本站 [这篇文章](https://code.zackzhang.net/post/upgrading-openssl-for-centos-7-by-compiling-source-codes/) 写的那样自己编译的，直接使用 `yum` 安装即可：

```sh
sudo yum install openssl11-devel
```

{{< notice info >}}

注意到安装后执行 `openssl version` 输出的版本号依然是旧的 1.0.2，因为 `/usr/bin` 里面的二进制可执行文件 `openssl` 依然是旧版的，看起来这个软件包并不带二进制可执行文件，就只是一些开发库，猜测是有 `-devel` 后缀的原因？不过由于本文涉及的内容都不需要它，也无所谓了。

{{< /notice >}}

先清理一下编译产物：

```sh
make clean
```

再重新走一遍配置。

What？？？居然还提示 OpenSSL 版本过低。在网上搜了一通，Stack Overflow 上的 [该回答](https://stackoverflow.com/a/75880038) 提到是因为动态链接库被安装在了 `/usr/lib64` 里，这不是 `configure` 的默认搜索路径，所以需要在配置的时候自行指定：

```sh
./configure --enable-optimizations --with-openssl=/usr --with-openssl-rpath=/usr/lib64
```

居然还是不行，找不到新安装的 OpenSSL。又在上述 Stack Overflow 链接中看到另一个回答，说需要先这样做：

```sh
mkdir /usr/local/openssl11
cd /usr/local/openssl11
ln -s /usr/lib64/openssl11 lib
ln -s /usr/include/openssl11 include
```

也就是把 OpenSSL 的动态链接库目录 `/usr/lib64/openssl11` 和头文件目录 `/usr/include/openssl11` 软链接到 `/usr/local/openssl11` 中，然后在配置时指定该目录为 OpenSSL 的安装目录：

```sh
./configure --enable-optimizations --with-openssl=/usr/local/openssl11
```

很有趣，玩了个 trick 欺骗 `configure`。

终于，输出中没有提示 OpenSSL 有问题了。然而再次编译却报错：

```
Could not import runpy module
Traceback (most recent call last):
  File "/home/zack/tools/Python-3.10.13/Lib/runpy.py", line 15, in <module>
    import importlib.util
  File "/home/zack/tools/Python-3.10.13/Lib/importlib/util.py", line 14, in <module>
    from contextlib import contextmanager
  File "/home/zack/tools/Python-3.10.13/Lib/contextlib.py", line 4, in <module>
    import _collections_abc
SystemError: <built-in function compile> returned NULL without setting an exception
generate-posix-vars failed
```

Stack Overflow 上的 [该回答](https://stackoverflow.com/a/74126892) 提及是 GCC 版本过低（当前是 4.8.5）导致应用优化出错，要么升级 GCC，要么在配置时去掉 `--enable-optimizations` 参数，`yum` 检测 GCC 无更新，要升级或许又需要自己编译，不想多折腾，故还是选择了去掉优化参数：

```sh
./configure --with-openssl=/usr/local/openssl11
```

再次编译终于成功了。接下来运行一下测试：

```sh
make test
```

测试真的好慢，比编译还慢。最终输出：

```
Tests result: FAILURE then SUCCESS
```

所以这是啥意思……成功还是不成功？注意到测试过程中确实有输出一些报错信息，例如 `multiprocessing` 模块的，提示 `fork` 出错，我寻思着也没用 `sudo` 运行测试，它能 `fork` 成功吗？所以这些问题或许也不全是编译的问题吧，不想再一个个检查了，不管了到时候运行有问题再说，直接安装吧：

```sh
sudo make install
```

一定要用 `sudo` 运行安装，前面的配置、编译、测试其实都没有动系统文件（所以怎么折腾都没事），而这步操作动了。

安装其实就是把编译的产物复制到系统相关目录中。其中二进制可执行文件 `python3` 被安装在 `/usr/local/bin`，并未覆盖以前使用 `yum` 安装的 `/usr/bin/python3`，即旧的 3.6。事实上自行编译的软件都是安装在 `/usr/local` 中，可能这是一个约定吧。而系统环境变量 `PATH` 中，`/usr/local/bin` 位于 `/usr/bin` 之前，所以此后在命令行执行 `python3` 就是新的 3.10 了。检查下版本：

```sh
[zack@vultr Python-3.10.13]$ python3 -V
Python 3.10.13
```

完工！此后就可以用它来创建虚拟环境，安装新的 Django 4.2 了。

---

参考资料：

- [Setup and building](https://devguide.python.org/getting-started/setup-building/)
- [linux - Building Python and OpenSSL from source, but ssl module fails - Stack Overflow](/questions/60536472/building-python-and-openssl-from-source-but-ssl-module-fails)
- [gcc - how to succesfully compile python 3.x - Stack Overflow](/questions/58048079/how-to-succesfully-compile-python-3-x)
- [在CentOS 7环境源码编译Python 3 — Cloud Atlas beta 文档](/zh-cn/latest/python/startup/build_python3_in_centos7.html)