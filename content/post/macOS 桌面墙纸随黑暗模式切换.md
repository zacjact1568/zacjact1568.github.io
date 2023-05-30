---
title: macOS 桌面墙纸随黑暗模式切换
slug: switch-macos-desktop-wallpaper-along-with-dark-mode
date: 2020-05-31
---

本文介绍了利用 macOS Mojave 及更高版本系统（10.14+）的原生特性，实现桌面墙纸随黑暗模式自动切换的方法。

<!--more-->

macOS Mojave（10.14）在带来了黑暗模式（dark mode）的同时，也带来了随时间变化的动态桌面墙纸，但其只内置了两套动态墙纸（10.15 是三套），并没有提供系统级的动态墙纸制作工具。原因很可能是苹果考虑到动态墙纸的实现机理略复杂，其并不是简单的定时更换，而是根据太阳的坐标（高度角和方位角）来更换的，具体可阅读[这篇文章](https://sspai.com/post/47390)。

即使苹果没有提供系统级的制作工具，依然有一些现成的工具可使用，例如在线制作网站 [Dynamic Wallpaper Club](https://dynamicwallpaper.club)，以及命令行工具 [wallpapper](https://github.com/mczachurski/wallpapper)。

Dynamic Wallpaper Club 上有一些用户分享的很不错的动态墙纸，[Licancabur](https://dynamicwallpaper.club/wallpaper/rzeg18a2re) 就是我很喜欢的一套，其中只包含两张墙纸，白天（左）和黑夜（右）：

![mac-dm-dwc-licancabur](https://image.zacjact1568.com/post/mac-dm-dwc-licancabur.jpg)

{{< notice info >}}

Licancabur（利坎卡武尔）是智利与玻利维亚交界处的一座火山。

{{< /notice >}}

动态墙纸是 HEIC 格式的，里面包含有多张图片，可使用“预览”app 打开。这是从 Dynamic Wallpaper Club 下载的 Licancabur.heic：

![mac-dm-show-in-preview](https://image.zacjact1568.com/post/mac-dm-show-in-preview.jpg)

左侧栏里就是这套动态墙纸中的所有墙纸了（不知道为什么黑夜墙纸有两张）。

然而，在用了一段时间这套动态墙纸后，我发现它的切换很不准，不知道作者具体参数是怎么设置的，明明没有到日落时间，却切换成了黑夜墙纸。考虑到这套墙纸只有白天、黑夜两张，就想把它做成直接随黑夜模式的开关自动切换的动态墙纸。

首先从下载的 HEIC 文件中提取两张墙纸，直接在“预览”左侧栏的墙纸双指点按（右键），选择“导出为...”，格式选择 JPEG 即可。

尝试了 Dynamic Wallpaper Club 在线制作：

![mac-dm-dwc-creation](https://image.zacjact1568.com/post/mac-dm-dwc-creation.jpg)

上图左侧可以看到，制作选项只有两个，Sun 和 Time，我选择了 Time，再在右侧选择 Light 和 Dark 墙纸，分别对应黑暗模式的关和开，可还是要选择 Time，我要的动态墙纸是跟时间无关的，所以就全填了 00:00。然而测试表明，这样的配置并不能实现想要的效果，墙纸并不会随着黑暗模式的开关而切换。

所以使用了另一种方法，命令行工具 wallpapper。这个工具是用 Swift 写的，作者说需要安装有 XCode 10.2 和 Swift 5，我的 XCode 一直维持在最新版，所以也没去看具体是什么版本。

我安装了 Homebrew，所以直接使用 `brew` 命令安装 wallpapper：

```
brew tap mczachurski/wallpapper
brew install wallpapper
```

因为我的系统版本已经是 Catalina（10.15），在执行 `brew install wallpapper` 的时候有以下输出：

```
Warning: You are using macOS 10.15.
We do not provide support for this pre-release version.
You will encounter build failures with some formulae.
Please create pull requests instead of asking for help on Homebrew's GitHub,
Discourse, Twitter or IRC. You are responsible for resolving any issues you
experience, as you are running this pre-release version.
```

看起来这个工具最后的更新时间应该在 Catalina 正式版本发布之前。所幸后来 build、运行的时候并没有出错。

{{< notice info >}}

不想通过 Homebrew 安装的话，wallpapper 的 GitHub 页面提供了通过源码自行编译安装的方法。

{{< /notice >}}

安装好后，就开始制作动态墙纸了。需要先准备一个 JSON 配置文件，其内容有三种形式，对应随太阳坐标、时间，以及黑暗模式的变化来切换墙纸。如果只是需要随黑暗模式切换，内容很简单：

```json
[
    {
        "fileName": "licancabur_day.jpg",
        "isPrimary": true,
        "isForLight": true
    },
    {
        "fileName": "licancabur_night.jpg",
        "isForDark": true
    }
]
```

其中，两个 `fileName` 表示两张墙纸的文件名，分别对应白天和黑夜；`isPrimary` 表示主墙纸，即系统设置中该动态墙纸的预览，设为白天；`isForLight` 和 `isForDark` 分别标记对应的墙纸用于黑暗模式关或开（我的是 `licancabur_day.jpg` 和 `licancabur_night.jpg`）。

把这个 JSON 配置文件（我的是 `licancabur.json`）和两张墙纸文件放到同一目录下，进入这个目录，执行：

```
wallpapper -i licancabur.json -o Licancabur.heic
```

其中，使用 `-i` 指定配置文件，`-o` 指定输出 HEIC 格式的动态墙纸文件（我的是 `Licancabur.heic`）。

最终生成的 `Licancabur.heic` 就是所需要的动态墙纸了。看下我的效果：

![mac-dm-result](https://image.zacjact1568.com/post/mac-dm-result.gif)

满足要求，大功告成！