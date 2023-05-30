---
title: 在 Ubuntu 18.04 上搭建 Minecraft 基岩版官方服务端
slug: installing-minecraft-bedrock-dedicated-server-on-ubuntu-18-04
date: 2019-03-30
---

这篇文章介绍了我在 Ubuntu 18.04 上搭建官方的 Minecraft 基岩版服务端（Minecraft Bedrock Dedicated Server）的过程。

<!--more-->

{{< notice warning >}}

<div style="color: #f0ad4e; font-size: 1.3em; font-weight: bold">⚠️ 注意</div>

请务必使用 Ubuntu 18.04（或更高版本，未测试），其他 Linux 发行版理论上也行，只是会有很多坑，别问我为什么知道。

{{< /notice >}}

# 环境

阿里云学生机，配置为 1 核 CPU，2G 内存，拥有公网 IP，操作系统为 Ubuntu 18.04。

我以 `zack` 用户的身份登录到服务器。该用户加入了 `sudo` 组，也就是说可以使用 `sudo` 命令提权。这是我专门用来操作该服务器的用户，用 `root` 用户直接操控系统是很不安全的（当然，有自信的当我没说，且用且珍惜）。

# 安装

## 下载

打开官方服务端的下载[页面](https://www.minecraft.net/zh-hans/download/server/bedrock/)：

![inst-mcbds-download-page](https://image.zacjact1568.com/post/inst-mcbds-download-page.jpg)

右边是 Ubuntu 的服务端。勾选同意协议后，右键下载按钮拷贝链接，写这篇文章时的最新版本为 1.10.0.7。

{{< notice warning >}}

请留意 Minecraft 客户端的大版本是否与下载的一致，客户端版本在主界面右下角：

![inst-mcbds-client-version](https://image.zacjact1568.com/post/inst-mcbds-client-version.jpg)

如果客户端版本高于服务器，在连接服务器的时候会提示“无法连接：过期的服务器”。

{{< /notice >}}

接着在服务器上操作：

创建安装服务端的目录，例如我的是 `~/minecraft/bedrock`。`cd` 进入该目录，使用 `wget` 下载刚才拷贝的链接，是一个压缩包，然后使用 `unzip` 解压（找不到命令的话用 `apt` 安装）：

```bash
wget https://minecraft.azureedge.net/bin-linux/bedrock-server-1.10.0.7.zip
unzip bedrock-server-1.10.0.7.zip
```

可以看到，解压出来的文件中有一个 `bedrock_server_how_to.html` 文件，这是附的**教程**，在本地下载一份打开查看。

## 配置

根据教程，配置文件为 `server.properties`，用 `vim` 打开修改。配置文件中的选项参考教程。我改了下面几个选项：

- 服务端名称：`server-name=Zack's Minecraft Bedrock Dedicated Server`
- 难度：`difficulty=normal`，默认是 `easy`
- 最大玩家数：`max-players=3`，我这小服务器可承受不起 10 个人
- 白名单：`white-list=true`，稍后设置
- 世界名称：`level-name=Nitrogen`，我的 Minecraft 世界名称是按元素周期表上常温下是气体的元素顺序来命名的，这是我的第三个世界（前两个是 Java 版的），so……PS：世界的相关文件放在 `worlds` 中的同名文件夹中，有则加载，无则新建，也就是说如果要更换世界，在启动服务端之前更改这个选项就行

接下来设置白名单，配置文件为 `whitelist.json`，用 `vim` 打开修改。我的配置如下：

```json
[
        {
                "name": "zacjact1568",
                "ignoresPlayerLimit": true
        }
]
```

- `name`：玩家的 Xbox Live 游戏标签，因此要求玩家必须登录 Xbox Live（盗版退散）
- `ignoresPlayerLimit`：是否忽略 `server.properties` 中使用 `max-players` 选项指定的最大玩家数，但服务端硬性规定了玩家数不能超过 30，也就是说，如果当前服务端中玩家数大于指定的最大玩家数但小于 30，那么该字段为 `true` 的玩家就可以强行加入，玩家数等于 30 就不行了

## 开放端口号

默认端口号是 `19132`，而一些云服务器提供商默认只开放几个常用的端口号，反正不包括这个就是了，所以要自行去打开。例如我用的阿里云，需要登录管理控制台，在实例使用的安全组规则下添加这么一条：

![inst-mcbds-aliyun-open-port](https://image.zacjact1568.com/post/inst-mcbds-aliyun-open-port.jpg)

{{< notice warning >}}

协议类型是 UDP，不是 TCP！官方 Wiki 上有写。

PS：Java 版服务端用的才是 TCP。

{{< /notice >}}

此外，一些 Linux 发行版还自带默认开启的防火墙（例如 CentOS 7），还得自行去允许访问相应的端口号。

## 启动

根据教程，执行以下命令启动服务端：

```bash
sudo LD_LIBRARY_PATH=. ./bedrock_server
```

需要使用 `root` 身份执行，否则会报错。

输出一些服务端的版本、配置信息，启动成功：

![inst-mcbds-start-server](https://image.zacjact1568.com/post/inst-mcbds-start-server.jpg)

注意最下面的光标，在这个界面可以输入一些命令，例如踢出玩家、更改游戏难度等，具体见教程。

打开 Minecraft 客户端，添加服务器：

![inst-mcbds-client-add-server](https://image.zacjact1568.com/post/inst-mcbds-client-add-server.jpg)

- 服务器名称：可以跟服务端配置文件中 `server-name` 选项指定的不一样，但不能超过 16 个字符
- 服务器地址：填服务器的外网 IP 地址

保存后可以在服务器列表中找到啦（如果找不到，可以尝试下杀掉 app 重新启动）：

![inst-mcbds-client-server-list](https://image.zacjact1568.com/post/inst-mcbds-client-server-list.jpg)

可以看到，显示出了服务器名称、当前在线玩家和最大玩家数，以及网络情况。

下面最重要的来了，进入世界看看……（好紧张）：

![inst-mcbds-world-first-glance](https://image.zacjact1568.com/post/inst-mcbds-world-first-glance.jpg)

成功啦，服务端也输出了玩家连接的信息：

```
[2019-03-29 18:22:31 INFO] Player connected: zacjact1568, xuid: 2533275013650129
```

这个 `xuid` 是玩家首次连接的时候自动生成的，相当于玩家的唯一标识符，稍后会用到。

PS：可以看到程序自动在 `whitelist.json` 中添加了对应玩家的 `xuid` 字段。

## 玩家权限

玩家有三种权限，`operator`、`member` 和 `visitor`，也没在教程里找到这三种权限的具体说明，不过从名字来看应该是由高到低了。默认权限是 `member`，使用 `server.properties` 中的 `default-player-permission-level` 选项指定，也就是说，如果不在该文件中指定某个玩家的权限，那么该玩家的权限就是 `member`。但我自己玩当然要最高权限了，所以还需要配置一下。

在客户端上退出服务器，然后电脑上也退出服务端程序（macOS 按 `⌃C`）。用 `vim` 打开权限配置文件 `permissions.json` 修改。我的配置如下：

```json
[
	{
		"xuid": "2533275013650129",
		"permission": "operator"
	}
]
```

- `xuid`：在客户端连接到服务器时输出的信息中可以找到
- `permission`：权限名，我的是最高权限 `operator`

# 后台运行

可以发现，启动服务端后就必须保持 SSH 连接，一旦关闭终端，会话结束，服务端进程也就随之关闭了。Minecraft 基岩版的官方服务端又没有后台执行的命令。但还有一个神器——Screen，它可以让命令在一个新的会话窗口中执行。

首先，使用 `apt` 安装 Screen：

 ```bash
 sudo apt install screen
 ```
 
 使用 `screen` 命令启动一个名为 `mcbds` 的新会话窗口：
 
```bash
screen -S mcbds
```

可以看到，进入了一个全新的命令行界面，像是启动了一个新的终端窗口。而还是保留了当前路径。在这个“新窗口”中输入上面的启动服务端的命令。

接着按 Control + A 键（macOS 是 `⌃A`），松手（注意按完没有任何反应），再按 D 键，可以看到，又回到了原来的终端窗口，有信息输出：

```
[detached from 3307.mcbds]
```

D 指“detach”，表示暂时从这个“新窗口”中离开。

现在就可以安心地使用 `exit` 命令从服务器登出了，Minecraft 服务端会借助 Screen 在后台运行。下次登录服务器，再使用以下命令恢复 `mcbds` 会话窗口：

```bash
screen -x mcbds
```

如果想关闭这个会话窗口，退出服务端后，在该会话窗口中内执行 `exit` 即可回到原来的终端窗口，输出信息：

```
[screen is terminating]
```

# 参考资料

- [Bedrock Dedicated Server – Official Minecraft Wiki](https://minecraft.gamepedia.com/Bedrock_Dedicated_Server)
- [Minecraft 基岩版官方服务器Alpha测试版本开服指南 - 基岩版多人联机 - Minecraft(我的世界)中文论坛 -](http://www.mcbbs.net/thread-822207-1-1.html)
- [Linux里的screen命令使用方法-接20步开服帖 - 基岩版多人联机 - Minecraft(我的世界)中文论坛 -](http://www.mcbbs.net/thread-255340-1-1.html)
- [linux screen 命令详解 - zhezhelin - 博客园](https://www.cnblogs.com/cute/p/5015852.html)
- [【基岩版官服】 Minecraft Bedrock Dedicated Server - 基岩版软件资源 - Minecraft(我的世界)中文论坛 -](http://www.mcbbs.net/thread-820742-1-1.html)

# 后记

我购买阿里云学生机的目的就是为了搭 Minecraft 服务端，买的时候想到既然自己已经把 Vultr 的服务器换成 CentOS 7 了，阿里云的也用 CentOS 7 吧，没想到要搭的时候才看到官方服务端居然说的只支持 Ubuntu……exo me？但在网上看到其他人以前发布的该网页的截图来看，“Ubuntu”原来是“Linux”，不知 Mojang 是因为何种原因只支持 Ubuntu 了。但想到不都是 Linux 发行版吗，按理来说安装起来不会有太大差别吧，然而搭的时候才发现坑多到爆炸，OpenSSL 版本低的问题解决了，又来个 glibc 和 glibcxx，看到网上说升级 glibc 很危险，但还是准备试一试，然而 configure 的时候就报错了，说很多依赖都没有，看着这一大堆 `no` 头大，心一横把系统重装成 Ubuntu 18.04 了，直接就能启动服务器了，没有任何报错，也怪不得网页上要把“FOR LINUX”改成“FOR UBUNTU”了🙄。