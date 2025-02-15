---
title: "R-CNN 安装记录"
date: "2017-03-19"
excerpt: "R-CNN 是一个目标检测系统，来源于 Ross Girshick 和他的团队在 2014 年发表的一篇[论文](http://arxiv.org/abs/1311.2524)，它的意义在于使用了深度学习来进行目标检测。\r\n\r\n这是一篇记录 R-CNN 安装过程的文章。"
---

R-CNN 是一个目标检测系统，来源于 Ross Girshick 和他的团队在 2014 年发表的一篇[论文](http://arxiv.org/abs/1311.2524)，它的意义在于使用了深度学习来进行目标检测。

这是一篇记录 R-CNN 安装过程的文章。

{# {"type": "notice", "level": "warning", "content": "虽然下述内容在我的电脑上测试通过，但是自此文章发表到现在已经有很长一段时间了，由于电脑配置、软件版本等的差异，下述内容不一定适用于每个人，如果发现错误，请求助于其他博客，敬请留意！"} #}

# 安装 Ubuntu

我的笔记本已经有了 Windows 系统，所以需要再装一个 Ubuntu 组成双系统，我安装的 Ubuntu 版本是 16.04。开始也尝试过 14.04，但是由于 NVIDIA 驱动安装不上，遂放弃了。我的笔记本主板支持 UEFI，因此，我是采用 UEFI + GPT 的方式安装的。

{# {"type": "notice", "level": "warning", "content": "注意，某些主板需要在 BIOS 设置里关闭 Secure Boot，否则无法安装除 Windows 以外的操作系统。"} #}

下载 Ubuntu（最新版本的[下载地址](https://www.ubuntu.com/download/desktop)），我写这篇记录的时候，版本是 16.04.2。然后参考[这篇](http://jingyan.baidu.com/article/e3c78d6460e6893c4c85f5b1.html)教程安装。

安装完成后，我默认的引导变成 GRUB 了，也就是可以直接进入 Ubuntu 了，要进入 Windows 还得在 GRUB 界面多按两下（有种 Ubuntu 鸠占鹊巢的感觉……）。其实也可以在 BIOS 设置中把 Windows Boot Manager 置为第一启动项，就可以默认进入 Windows 了。

进入 Ubuntu 后，发现不能开启 WiFi，找到系统设置中的 WiFi 开关，拨到“开”之后，马上又跳回“关”。解决方案如下：

编辑配置文件 `/etc/modprobe.d/blacklist.conf`，在此文件末尾添加

```
blacklist acer-wmi
```

重启，OK。

# 配置 Caffe

Caffe 的安装主要是参照官网的[安装教程](http://caffe.berkeleyvision.org/installation.html)。

## 安装 CUDA

我的笔记本（华硕 A450JF）是双显卡的，配置如下：

- CPU：Intel Core i7-4700HQ
- GPU：NVIDIA GeForce GT 745M + Intel HD Graphics 4600

Caffe 支持 CPU 和 GPU 模式，我的笔记本有 NVIDIA 独显，因此我选用 GPU 模式，可以加快训练模型的速度。

{# {"type": "notice", "level": "info", "content": "Caffe 选用 CPU 模式的话，可以跳过这部分。"} #}

如果使用 Ubuntu 16.04 的话，需要安装 CUDA 8，官网也有[安装教程](http://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html)。教程里介绍了两种安装方式，Package Manager（.deb）和Runfile（.run），当然，Caffe 官网说也可以使用 apt-get 安装，但是我没试过，我使用 .run 安装。为什么不使用更方便的 .deb 安装呢？因为我以前在 14.04 下试过 .deb 安装，重启后会卡在开机的紫色 Ubuntu 界面，只听见咚的开机声，连登录界面都出不来，所以果断不用了。另外，使用 .run 安装可以指定不安装 OpenGL 的库，避免可能出现的循环登录问题。

### 安装前检查

获取 NVIDIA GPU 型号，执行

```
$ lspci | grep -i nvidia
```

如果能在[这里](http://developer.nvidia.com/cuda-gpus)找到此型号，那么此 GPU 支持 CUDA。

其他还有一些系统环境的检查，以及下载并校验安装包等，在[教程](http://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#pre-installation-actions)上都可以找到。另外，如果之前有安装过 CUDA，需要[卸载](http://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#handle-uninstallation)之前的安装。

### 使用 Runfile 安装

[下载](https://developer.nvidia.com/cuda-downloads)安装包，最后 Installer Type 选择 runfile (local) 即可。

![](/images/rcnn-installation-memo/cuda-download.jpg)

我下载的文件名是 `cuda_8.0.61_375.26_linux.run`。

#### 禁用 Nouveau 驱动

Nouveau 是自带的显卡驱动，不禁用它就无法安装 NVIDIA 显卡驱动。

首先执行

```
$ gedit /etc/modprobe.d/blacklist-nouveau.conf
```

这是个新建的空文件，添加

```
blacklist nouveau
options nouveau modeset=0
```

再执行

```
$ sudo update-initramfs -u
```

重启，检验 Nouveau 是否成功禁用，执行

```
$ lsmod | grep nouveau
```

如果什么也没输出，说明禁用成功。

#### 重启至 Text Mode 安装

在登录界面按 Ctrl + Alt + F1，进入 Text Mode，输入用户名和密码登录。

关闭桌面服务，执行

```
$ sudo /etc/init.d/lightdm stop
```

使用 cd 命令进入放置 .run 文件的目录，执行

```
$ sudo sh <安装包文件名>.run --no-opengl-libs
```

对于我的电脑，不添加 `--no-opengl-libs` 参数的话，会出现循环登录的问题，官网安装教程上对此的解释是：

> If installing the driver, the installer will also ask if the openGL libraries should be installed. If the GPU used for display is not an NVIDIA GPU, the NVIDIA openGL libraries should not be installed. Otherwise, the openGL libraries used by the graphics driver of the non-NVIDIA GPU will be overwritten and the GUI will not work. If performing a silent installation, the --no-opengl-libs option should be used to prevent the openGL libraries from being installed.

执行安装命令后，会有一长段的最终用户许可协议，一直按回车即可。开始安装之前会有：

- Accept EULA? (accept)
- Install driver? (y)
- Run nvidia-xconfig? (回车)
- Install CUDA Toolkit? (y)
- Enter location. (回车)
- Install a symbol link? (y)
- Install CUDA Samples? (y)
- Enter location. (回车)

安装完成后，会显示 Driver、Toolkit、Samples 的安装状态，因为指定了不安装 OpenGL 的库，所以最后会提示 `missing recommend library`。

执行 `reboot` 重启，顺利进入桌面。

刚才没有安装 OpenGL 的库，最好安装一下必要的库，执行

```
$ sudo apt-get install freeglut3-dev
$ sudo apt-get install libxmu-dev
```

#### 配置环境变量

在 `~/.bashrc` 末尾添加

```bash
export PATH=/usr/local/cuda-8.0/bin:${PATH}
export LD_LIBRARY_PATH=/usr/local/cuda-8.0/lib64:${LD_LIBRARY_PATH}
```

修改了环境变量，需要再执行

```
$ source ~/.bashrc
```

#### 配置动态链接库

执行

```
$ sudo gedit /etc/ld.so.conf.d/cuda.conf
```

这是个新建的空文件，添加

```
/usr/local/cuda/lib64
/lib
```

再执行

```
$ sudo ldconfig
```

#### 验证安装

执行以下命令打印驱动版本

```
$ cat /proc/driver/nvidia/version
```

执行以下命令查看 CUDA 版本

```
$ nvcc -V
```

执行以下命令查看显卡状态

```
$ nvidia-smi
```

### 编译示例程序

```
$ cd ~/NVIDIA_CUDA-8.0_Samples/1_Utilities/deviceQuery
$ make
```

编译完成后，执行示例程序

```
$ cd ~/NVIDIA_CUDA-8.0_Samples/bin/x86_64/linux/release
$ ./deviceQuery
```

如果看到显卡的一些信息

![](/images/rcnn-installation-memo/cuda-device-query-execution-result.jpg)

说明 CUDA 安装成功。

根据[官网教程](http://docs.nvidia.com/cuda/cuda-installation-guide-linux/index.html#runfile-verifications)，需要检查下 `/dev` 路径是否有 nvidia 开头的文件以及这些文件的权限是否是 0666。在运行示例程序之前，这些文件应该不存在。

## 安装 cuDNN

{# {"type": "notice", "level": "info", "content": "Caffe 选用 CPU 模式的话，可以跳过这部分。"} #}

其实 cuDNN 是可选安装的，但是 Caffe 官网上说这货可以加快 Caffe 运算速度，所以还是装吧。

在官网[下载](https://developer.nvidia.com/rdp/cudnn-download) cuDNN，需要注册账号才能下载。

![](/images/rcnn-installation-memo/cudnn-download.jpg)

我下载的文件名是 `cudnn-8.0-linux-x64-v5.1.tgz`。

下载后，进入存放安装包的文件夹，执行

```
# 解压安装包
$ tar zxvf <压缩包文件名>.tgz
# 进入解压后的文件夹
$ cd cuda
# 复制头文件
$ sudo cp include/cudnn.h /usr/local/cuda/include/
# 复制动态链接库
$ sudo cp lib64/lib* /usr/local/cuda/lib64/
# 进入库文件夹
$ cd /usr/local/cuda/lib64/
# 删除原有动态链接文件
$ sudo rm -rf libcudnn.so libcudnn.so.<具体数字a>
# 生成软链接
$ sudo ln -s libcudnn.so.<具体数字a>.<具体数字b>.<具体数字c> libcudnn.so.<具体数字a>
$ sudo ln -s libcudnn.so.<具体数字a> libcudnn.so
# 对于不同版本的cuDNN，具体数字a、b、c可能存在差异
```

## 安装 MKL

Caffe 需要使用 BLAS，官网上推荐了三种实现：ATLAS、Intel MKL 和 OpenBLAS。因为笔记本是 Intel 的 CPU，所以我使用 MKL 来做，可能性能要好些吧。当然，不使用 MKL 的话可以跳过这部分，直接使用 apt-get 安装 ATLAS 就行。

在[官网](https://software.intel.com/en-us/qualify-for-free-software)申请学生版（Student）或社区版（Community）的许可证，学生版需要使用学校邮箱，社区版随便什么邮箱（我用的是 126）。申请完成后，Intel 会发来一封邮件，邮件里有个 Download 按钮和一串激活码，点击 Download 按钮应该就可以跳到下载页面了，选择 Linux 的 MKL 下载。

![](/images/rcnn-installation-memo/mkl-download.jpg)

我下载的版本是 2017 Initial Release，文件名是 `l_mkl_2017.0.098.tgz`，现在最新的版本是 2017 Update 2。

然后开始安装 MKL，进入存放安装包的文件夹，执行

```
# 解压安装包
$ tar zxvf <压缩包文件名>.tgz
# 给予解压后的文件夹权限
$ chmod -R 777 <解压后的文件夹>
# 进入解压后的文件夹
$ cd <解压后的文件夹>
# 进行安装，当然也可以执行install_GUI.sh使用图形界面安装
$ sudo ./install.sh
```

按照给出的提示一步步安装就行了，中途会提示激活，输入发到邮箱里的 serial number：

![](/images/rcnn-installation-memo/mkl-input-serial-number.jpg)

回车，等一会儿就会提示激活成功啦。然后继续安装。

出现下面这个界面，说明安装成功了。

![](/images/rcnn-installation-memo/mkl-installation-completed.jpg)

接着还要指定 MKL 动态链接库的路径。执行

```
$ sudo gedit /etc/ld.so.conf.d/intel_mkl.conf
```

这是个新建的空文件，添加

```
/opt/intel/lib/intel64
/opt/intel/mkl/lib/intel64
```

再执行

```
$ sudo ldconfig
```

## 安装 MATLAB

R-CNN 使用 Caffe 的 MATLAB 接口，因此必须安装 MATLAB。此软件在网上很容易就能找到（当然，我只是做学习使用的哈）。我用的版本是 R2014a，文件名为 `MATHWORKS_R2014A.iso`。

先右键 MATLAB 安装包（.iso 文件），Open With -> Disk Image Mounter，就把 .iso 文件挂载上了，将所有文件复制到某个路径。

一般随 MATLAB 提供下载的还有破解文件吧，我下载的破解文件夹名是 `Crack`。用 `Crack` 文件夹下的 `install.jar` 替换安装目录中的 `java/jar` 下的同名文件，再执行

```
$ cd <安装目录的父目录>
# 给予安装目录权限
$ chmod -R 777 <安装目录>
$ cd <安装目录>
# 执行安装程序
$ sudo ./install
```

接下来就是图形安装界面了。以下是我安装 R2014a 版本的步骤：

- 选择 `Use a File Installation Key`
- 选择 `I have the File Installation Key for my license`，输入 `12345-67890-12345-67890`
- 选择 `Activate manually without the Internet`
- 选择 `Enter the full path to your license file`，选择 `Crack` 文件夹下的激活文件 `license_405329_R2014a.lic`

默认会安装在 `/usr/local/MATLAB/R2014a` 下。

最后，将 `Crack/Linux` 下的 `libmwservices.so` 文件复制到 MATLAB 安装路径的 `bin/glnxa64` 下，这需要用命令执行：

```
$ sudo cp <Crack文件夹路径>/Linux/libmwservices.so /usr/local/MATLAB/R2014a/bin/glnxa64
```

安装完成。但是这时还不能直接执行 `matlab` 命令打开 MATLAB，需要添加环境变量。编辑 `~/.bashrc`，在末尾添加

```bash
export PATH=/usr/local/MATLAB/R2014a/bin:$PATH
```

再执行

```
$ source ~/.bashrc
```

就可以直接使用 `matlab` 命令打开 MATLAB 了。

{# {"type": "notice", "level": "info", "content": "实际上，在安装 MATLAB 的时候就可以选择是否从默认启动路径创建符号链接，勾选了的话就不用手动设置环境变量了，但是我直接跳过了。"} #}

## 安装依赖库

根据 Caffe 官网，需要安装一些依赖库

```
# Boost
$ sudo apt-get install --no-install-recommends libboost-all-dev
# protobuf
$ sudo apt-get install libprotobuf-dev protobuf-compiler
# glog
$ sudo apt-get install libgoogle-glog-dev
# gflags
$ sudo apt-get install libgflags-dev
# hdf5
$ sudo apt-get install libhdf5-serial-dev
# IO libraries: lmdb, leveldb (note: leveldb requires snappy)
$ sudo apt-get install liblmdb-dev libleveldb-dev libsnappy-dev
# OpenCV
$ sudo apt-get install libopencv-dev
```

{# {"type": "notice", "level": "info", "content": "我并没有像网上大多教程那样，手动去编译 OpenCV 等依赖库，因为这里已经用 `apt-get` 安装过了，这些都是官网的[教程](http://caffe.berkeleyvision.org/install_apt.html)里提到过的。"} #}

## 安装 Python

{# {"type": "notice", "level": "info", "content": "事实上，R-CNN 的使用并不依赖 Caffe 的 Python 接口，因此也可以不安装 Python（未测试），但是为了走一遍安装 Caffe 的完整流程，我还是安装了 Python。"} #}

网上好多教程都在推荐使用 [Anaconda](https://www.continuum.io/downloads)，它独立于系统自带的 Python，并且附带有其他的库。我以前用过 Anaconda，但是后面编译 Caffe（master 分支，release v0.999 没测试过）的时候老是出错，禁用 Anaconda 就不会出错，所以我这次就没有用 Anaconda 了。

虽然系统自带有 Python，但是 Caffe 还需要 `python-dev`。执行以下命令安装：

```
$ sudo apt-get install python-dev
```

接着安装在 `<Caffe根目录>/python/requirements.txt` 中提到的其他 Python 库：

```
$ sudo apt-get install cython python-h5py ipython python-leveldb python-matplotlib python-networkx python-nose python-numpy python-pandas python-protobuf python-gflags python-skimage python-sklearn python-scipy
```

## 安装 Caffe

R-CNN 要求使用 release v0.999 的 Caffe，不支持 master 分支上的 Caffe。

先[下载](https://github.com/BVLC/caffe/archive/v0.999.tar.gz)压缩包，`cd` 进入下载路径，执行

```
# 解压缩包
$ tar zxvf caffe-0.999.tar.gz
# 进入解压出的文件夹
$ cd caffe-0.999
```

需要改下配置再编译，先复制一份 example 来修改

```
$ cp Makefile.config.example Makefile.config
$ gedit Makefile.config
```

下面是要修改的地方

- 17 行，`BLAS := atlas` 改成 `BLAS := mkl`。我使用 MKL 来做 BLAS，如果使用 ATLAS 就不用改
- 26 行，`# MATLAB_DIR := /usr/local`，取消注释并改成具体的 MATLAB 安装路径。例如我使用的是 R2014a，并且安装 MATLAB 的时候选择的是默认路径，就改成 `MATLAB_DIR := /usr/local/MATLAB/R2014a`

### 编译 Caffe

Caffe 的接口分为 3 种，命令行接口，Python 接口和 MATLAB 接口。

#### 编译命令行接口

开始编译，执行

```
$ make all -j8
```

参数 `-j8` 表示 8 线程编译，可以加快编译速度，一般设为 CPU 核心数的两倍

以下是错误记录。

错误 1：`fatal error: hdf5.h: No such file or directory`

因为 Ubuntu 16.04 的文件包含位置发生了变化，尤其是需要用到的 hdf5 的位置。需要更改 `Makefile.config` 文件中 43、44 两行的内容：

```
INCLUDE_DIRS := $(PYTHON_INCLUDE) /usr/local/include
LIBRARY_DIRS := $(PYTHON_LIB) /usr/local/lib /usr/lib
```

改成

```
INCLUDE_DIRS := $(PYTHON_INCLUDE) /usr/local/include /usr/include/hdf5/serial
LIBRARY_DIRS := $(PYTHON_LIB) /usr/local/lib /usr/lib /usr/lib/x86_64-linux-gnu /usr/lib/x86_64-linux-gnu/hdf5/serial
```

错误 2：

```
src/caffe/util/math_functions.cu(140): error: calling a __host__ function("std::signbit<float> ") from a __global__ function("caffe::sgnbit_kernel<float> ") is not allowed
src/caffe/util/math_functions.cu(140): error: calling a __host__ function("std::signbit<double> ") from a __global__ function("caffe::sgnbit_kernel<double> ") is not allowed
2 errors detected in the compilation of "/tmp/tmpxft_000061a6_00000000-11_math_functions.compute_35.cpp1.ii".
Makefile:340: recipe for target 'build/src/caffe/util/math_functions.cuo' failed
make: *** [build/src/caffe/util/math_functions.cuo] Error 2
make: *** Waiting for unfinished jobs....
```

通过更改源码可以解决，下面是要修改的地方。

对于文件 `include/caffe/util/math_functions.hpp`：

将第 224、225 行的内容由

```cpp
using std::signbit;
DEFINE_CAFFE_CPU_UNARY_FUNC(sgnbit, y[i] = signbit(x[i]));
```

改为

```cpp
// using std::signbit;
DEFINE_CAFFE_CPU_UNARY_FUNC(sgnbit, y[i] = std::signbit(x[i]));
```

居然就成功 make all 了，快得不真实啊，记得我编译 master 分支上的 Caffe 的时候，用了好长时间呢。继续吧，执行

```
$ make test -j8
```

这个倒没出错，也很快，我还搜索了下，看有没有 error 这个关键词，结果没有。再继续吧，执行

```
$ make runtest -j8
```

这次有错了。

错误 1：

```
build/test/test_all.testbin: symbol lookup error: /opt/intel/mkl/lib/intel64/libmkl_intel_thread.so: undefined symbol: __kmpc_global_thread_num
```

修改 `/etc/ld.so.conf.d/intel_mkl.conf` 文件，在末尾添加

```
/opt/intel/lib/intel64_lin
```

再执行

```
$ sudo ldconfig
```

错误 2：

```
[  FAILED  ] 7 tests, listed below:
[  FAILED  ] MathFunctionsTest/0.TestSgnbitCPU, where TypeParam = float
[  FAILED  ] PowerLayerTest/0.TestPowerGradientShiftZeroGPU, where TypeParam = float
[  FAILED  ] PowerLayerTest/0.TestPowerGradientShiftZeroCPU, where TypeParam = float
[  FAILED  ] PowerLayerTest/1.TestPowerGradientShiftZeroCPU, where TypeParam = double
[  FAILED  ] PowerLayerTest/1.TestPowerGradientGPU, where TypeParam = double
[  FAILED  ] PowerLayerTest/1.TestPowerGradientCPU, where TypeParam = double
[  FAILED  ] PowerLayerTest/1.TestPowerGradientShiftZeroGPU, where TypeParam = double
```

MathFunctionsTest 的问题通过更改源码可以解决，下面是要修改的地方。

对于文件 `include/caffe/util/math_functions.hpp`：

- 170 行，修改
```cpp
// inline char caffe_sign(Dtype val)
inline int8_t caffe_sign(Dtype val)
```
- 删除 189-193 行的内容，即删除
```cpp
#define INSTANTIATE_CAFFE_CPU_UNARY_FUNC(name) \
  template <> \
  void caffe_cpu_##name<float>(const int n, const float* x, float* y); \
  template <> \
  void caffe_cpu_##name<double>(const int n, const double* x, double* y)
```
- 218 行，修改
```cpp
// DEFINE_CAFFE_CPU_UNARY_FUNC(sgnbit, y[i] = std::signbit(x[i]));
DEFINE_CAFFE_CPU_UNARY_FUNC(sgnbit, y[i] = static_cast<bool>((std::signbit)(x[i])));
```

对于文件 `src/caffe/util/math_functions.cpp`：

- 删除 448-450 行的内容，即删除
```cpp
INSTANTIATE_CAFFE_CPU_UNARY_FUNC(sign);
INSTANTIATE_CAFFE_CPU_UNARY_FUNC(sgnbit);
INSTANTIATE_CAFFE_CPU_UNARY_FUNC(fabs);
```

PowerLayerTest 的问题通过更改源码可以解决，下面是要修改的地方。

对于文件 `src/caffe/test/test_power_layer.cpp`：

- 82 行，修改
```cpp
// GradientChecker<Dtype> checker(1e-2, 1e-2, 1701, 0., 0.01);
GradientChecker<Dtype> checker(1e-3, 1e-2, 1701, 0., 0.01);
```

改了源代码，还是 clean 一下重新编译吧，执行

```
$ make clean
$ make all -j8
$ make test -j8
$ make runtest -j8
```

大功告成！

![](/images/rcnn-installation-memo/caffe-make-runtest.jpg)

最后有一行 `YOU HAVE 2 DISABLED TESTS`，可以忽略掉。

#### 编译 Python 接口

开始编译，执行

```
$ make pycaffe -j8
```

以下是错误记录。

错误 1：`fatal error: pyconfig.h: No such file or directory`

找不到 `pyconfig.h` 这个文件，执行

```
$ locate pyconfig.h
```

查看一下哪儿有这个文件，结果如图所示

![](/images/rcnn-installation-memo/pyconfig-location.jpg)

重要的东西在第二行，这个文件应该是在 `/usr/include/python2.7` 下的，需要修改下 `Makefile.config` 文件中 Python 的相关路径，执行

```
$ gedit Makefile.config
```

下面是要修改的地方：

- 31、32 行，修改
```
# PYTHON_INCLUDE := /usr/local/include/python2.7 \
		/usr/local/lib/python2.7/dist-packages/numpy/core/include
PYTHON_INCLUDE := /usr/include/python2.7 \
		/usr/lib/python2.7/dist-packages/numpy/core/include
```
- 39 行，修改
```
# PYTHON_LIB := /usr/local/lib
PYTHON_LIB := /usr/lib
```

OK，成功编译。但是还没完，现在还不能直接在 Python 脚本调用 Caffe，要添加环境变量，编辑 `~/.bashrc` 文件，在末尾添加

```bash
export PYTHONPATH=<到Caffe文件夹的路径>/caffe-0.999/python:$PYTHONPATH
```

再执行

```
$ source ~/.bashrc
```

最后，验证一下，执行 `python` 进入 Python 环境，这里面就可以写 Python 代码了。在 Python 环境中执行

```
>>> import caffe
```

如果没有报错，那么 Caffe 的 Python 接口就配置完成了：

![](/images/rcnn-installation-memo/caffe-python.jpg)

#### 编译 MATLAB 接口

开始编译，执行

```
$ make matcaffe -j8
```

以下是错误记录

错误 1：

```
Unknown MEX argument '-o'.
Makefile:267: recipe for target 'matlab/caffe/caffe.mexa64' failed
make: *** [matlab/caffe/caffe.mexa64] Error 255
```

这应该是个 bug，并且在之后的 Caffe 版本中已经修复了。修改下 `Makefile` 文件就行：

- 272 行，修改
```
# $(MATLAB_DIR)/bin/mex $(MAT$(PROJECT)_SRC) $(STATIC_NAME) \
$(MATLAB_DIR)/bin/mex $(MAT$(PROJECT)_SRC) \
```
- 274 行，修改
```
# CXXLIBS="\$$CXXLIBS $(LDFLAGS)" -o $@
CXXLIBS="\$$CXXLIBS $(STATIC_NAME) $(LDFLAGS)" -output $@
```

继续编译，当看到 `MEX completed successfully.` 这句话，说明编译成功。这个老版本的 Caffe 没有提供 `make mattest` 命令来测试 MATLAB 接口，所以到这里就结束了。

### 测试 Caffe

Caffe 官网上有个使用 MNIST 数据集来训练 LeNet 网络的[教程](http://caffe.berkeleyvision.org/gathered/examples/mnist.html)，就用它来测试一下吧。

先下载数据，在 Caffe 根目录下执行

```
./data/mnist/get_mnist.sh
```

它会下载四个压缩包并解压，解压后的四个文件 `train-images-idx3-ubyte`、`train-labels-idx1-ubyte`、`t10k-images-idx3-ubyte`、`t10k-labels-idx1-ubyte` 放在 `<Caffe根目录>/data/mnist` 下。然而我下载的时候老连接不上 `yann.lecun.com`，明明前几天还是可以下载的，所以我用的是以前下载过的这四个文件。

接着生成标准数据，执行

```
./examples/mnist/create_mnist.sh
```

出现错误

```
../../build/examples/mnist/convert_mnist_data.bin: not found
```

看了下 `create_mnist.sh` 这个脚本的内容，发现应该是到 `<Caffe根目录>/examples/mnist` 下去执行这个脚本。官网的教程是针对最新版 Caffe 的，有些地方不适合老版了。执行

```
$ cd examples/mnist
$ ./create_mnist.sh
```

OK，显示 `Done.`，在当前目录下生成了 `mnist-test-leveldb` 和 `mnist-train-leveldb` 两个数据集文件夹。

接着开始训练。执行

```
$ ./train_lenet.sh
```

训练了 7 分多钟，结果如下图所示：

![](/images/rcnn-installation-memo/caffe-train-result.jpg)

可以看到，最终的训练精度是 0.9905。最终的模型储存为当前目录下的一个二进制 protobuf 文件 `lenet_iter_10000`。

# 安装 R-CNN

R-CNN 的安装主要是参考作者在 GitHub 上的[安装教程](https://github.com/rbgirshick/rcnn)。

## 安装前准备

在安装之前，还需要下载 ImageNet 图像均值文件。执行

```
$ cd data/ilsvrc12
$ ./get_ilsvrc_aux.sh
```

发现是从 Dropbox 上下载的，由于众所周知的原因，只好挂 VPN 了。

下载后提示 `gzip: stdin: not in gzip format`，手动去解压也不行，应该是压缩文件损坏了。看了看 master 分支下的 Caffe 工程中的 `get_ilsvrc_aux.sh` 脚本，发现原来下载地址改了，那就改一下这个脚本吧。

修改第 14 行：

```bash
# wget --no-check-certificate https://www.dropbox.com/s/g5myor4y2scdv95/caffe_ilsvrc12.tar.gz
wget -c http://dl.caffe.berkeleyvision.org/caffe_ilsvrc12.tar.gz
```

下载并解压成功。

## 开始安装

先把 R-CNN 的源码 clone 下来，执行

```
# 安装Git
$ sudo apt-get install git
# Clone R-CNN repository
$ git clone https://github.com/rbgirshick/rcnn.git
# 进入R-CNN源码目录
$ cd rcnn
```

R-CNN 需要在 `external/caffe` 中找到 Caffe，所以先创建符号链接。执行

```
$ ln -sf <到Caffe文件夹的路径>/caffe-0.999 external/caffe
```

再执行 `matlab` 打开 MATLAB。

然而我的 MATLAB 崩了，说什么 `Segmentation violation`。尝试了下在其他目录下执行 `matlab` 能成功打开 MATLAB。于是只好在其他目录下打开 MATLAB ，在 MATLAB 中把路径切换到 `rcnn` 下，再执行

```
>> startup
```

相当于执行了 `rcnn` 目录下的 `startup.m` 文件。

然后就会有下载 Selective Search 的提示

![](/images/rcnn-installation-memo/selective-search-download-prompt.jpg)

按任意键执行下载。下载完成后，看到有显示 `R-CNN startup done`，说明 R-CNN 在 MATLAB 中启动完成。接着执行

```
>> rcnn_build()
```

如果看到有显示 `MEX completed successfully.`，说明 build 成功了。开始可能会有 gcc 版本太高了的警告，直接忽略掉。接着检查下 Caffe 和 MATLAB 接口是否设置正确了。执行

```
>> key = caffe('get_init_key')
```

以下是错误记录。

错误 1：

```
Invalid MEX-file '/home/zack/rcnn/external/caffe/matlab/caffe/caffe.mexa64':
/usr/local/MATLAB/R2014a/bin/glnxa64/../../sys/os/glnxa64/libstdc++.so.6: version
`GLIBCXX_3.4.21' not found (required by
/home/zack/rcnn/external/caffe/matlab/caffe/caffe.mexa64)
```

这是因为 MATLAB 加载的是它自带的 `libstdc++.so.6`，而应该使用系统的 `libstdc++.so.6`，所以可以在启动 MATLAB 之前，将这个文件的路径添加到 `LD_PRELOAD` 中，也可以直接链接系统的这个文件到 MATLAB 的这个文件上。我选择后一种方法，执行

```
sudo ln -sf /usr/lib/x86_64-linux-gnu/libstdc++.so.6 /usr/local/MATLAB/R2014a/bin/glnxa64/libstdc++.so.6
```

错误 2：

```
Invalid MEX-file '/home/zack/rcnn/external/caffe/matlab/caffe/caffe.mexa64':
/home/zack/rcnn/external/caffe/matlab/caffe/caffe.mexa64: undefined symbol:
_ZN2cv6imreadERKNSt7__cxx1112basic_stringIcSt11char_traitsIcESaIcEEEi
```

这个问题和上面那个原因一样，还是直接链接吧。执行

```
$ sudo ln -sf /usr/lib/x86_64-linux-gnu/libopencv_core.so.2.4 /usr/local/MATLAB/R2014a/bin/glnxa64/libopencv_core.so.2.4
$ sudo ln -sf /usr/lib/x86_64-linux-gnu/libopencv_highgui.so.2.4 /usr/local/MATLAB/R2014a/bin/glnxa64/libopencv_highgui.so.2.4
$ sudo ln -sf /usr/lib/x86_64-linux-gnu/libopencv_imgproc.so.2.4 /usr/local/MATLAB/R2014a/bin/glnxa64/libopencv_imgproc.so.2.4
$ sudo ln -sf /usr/lib/x86_64-linux-gnu/libfreetype.so.6 /usr/local/MATLAB/R2014a/bin/glnxa64/libfreetype.so.6
```

{# {"type": "notice", "level": "info", "content": "其实也可以在启动 MATLAB 之前，将这几个文件的路径添加到 `LD_PRELOAD` 中，但是我嫌麻烦，就在 `~/.bashrc` 中添加到 `LD_PRELOAD` 中，然而使用 `gedit` 命令会报错（我不太会用 `vi`），所以就换了种方法。"} #}

成功了！显示 `key = -2` 就好，如图：

![](/images/rcnn-installation-memo/caffe-matlab.jpg)

## 进行测试

接下来下载预计算模型（作者已经训练好了的模型和候选区域数据），执行 `rcnn/data` 目录下的 `fetch_models.sh` 和 `fetch_selective_search_data.sh` 来下载。两个脚本下载的文件名分别为 `r-cnn-release1-data.tgz` 和 `r-cnn-release1-selective-search.tgz`。

这两个文件较大（一个 1.5G 一个 1.8G），我是切换到 Windows 用迅雷下载的。下载地址如下：

- [r-cnn-release1-data.tgz](http://www.cs.berkeley.edu/~rbg/r-cnn-release1-data.tgz)
- [r-cnn-release1-selective-search.tgz](http://www.cs.berkeley.edu/~rbg/r-cnn-release1-selective-search.tgz)

下载花了我将近两个小时，还是挂 VPN 下的，不然速度连 100K/s 都没有。

回到 Ubuntu 继续，将下载的两个文件移动到 `rcnn/data` 下，cd 命令进入 `rcnn/data`，再次执行 `fetch_models.sh` 和 `fetch_selective_search_data.sh`，这次执行的目的是验证一下校验和，如果校验和正确，就会显示 `Model checksum is correct. No need to download.`，然后就可以解压了，执行

```
$ tar zxvf r-cnn-release1-data.tgz
$ tar zxvf r-cnn-release1-selective-search.tgz
```

在当前目录下生成了 `caffe_nets`、`rcnn_models` 和 `selective_selective_data` 三个文件夹。

接下来就可以运行 demo 了，在 MATLAB 中把路径切换到 `rcnn` 下，先执行 `startup` 启动 R-CNN，再执行

```
>> rcnn_demo
```

运行 demo。根据提示，按任意键继续。

![](/images/rcnn-installation-memo/rcnn-demo.jpg)

执行到这里，人应该已经检测出来了，显示如下窗口：

![](/images/rcnn-installation-memo/rcnn-detectation-result-person.jpg)

再按回车键，窗口中的内容替换为检测到的自行车：

![](/images/rcnn-installation-memo/rcnn-detectation-result-bicycle.jpg)

再按回车键，MATLAB 的 Command Window 中显示 `No more detection with score >= 0`，说明没有得分大于等于 0 的物体了，检测完毕。

# 参考资料

- [求助：rfkill list 命令下，acer-wireless soft block（软阻塞）导致无线网卡无法使用 - 查看主题 • Ubuntu中文论坛](http://forum.ubuntu.org.cn/viewtopic.php?t=328097%E2%80%8D)
- [Ubuntu 14.04 安装 CUDA 问题及解决 - 高文刚 - 博客园](http://www.cnblogs.com/gaowengang/p/6068788.html)
- [Ubuntu16.04+cuda8.0+opencv3.1+caffe+anaconda安装，双显卡 - t5131828的专栏 - CSDN博客](http://blog.csdn.net/t5131828/article/details/53258925)
- [ubuntu16.04安装caffe以及各种问题汇总 - CSDN博客](http://blog.csdn.net/autocyz/article/details/51783857)
- [Ubuntu16.04系统下CUDA7.5配置Caffe教程 - G0m3e的博客 - CSDN博客](http://blog.csdn.net/g0m3e/article/details/51420565)
- [Caffe使用step by step：r-cnn目标检测代码 - Fight boy - 博客园](http://www.cnblogs.com/empty16/p/4897004.html)
- [std::signbit< float> is not allowed · Issue #3 · Evolving-AI-Lab/fooling](https://github.com/Evolving-AI-Lab/fooling/issues/3)
- [r-cnn+caffe-0.999+GTX1080 - CSDN博客](http://blog.csdn.net/sinat_29089097/article/details/52702246)
- [“YOU HAVA 2 DISABLED TESTS” · Issue #982 · BVLC/caffe](https://github.com/BVLC/caffe/issues/982)
- [Invalid MEX-file: caffe.mexa64 的解决方案 - CSDN博客](http://blog.csdn.net/ws_20100/article/details/50437079)
- [ubuntu下 编译Caffe的Matlab接口 - QQLQ - 博客园](http://www.cnblogs.com/laiqun/p/6031925.html)
- [Fix bug that breaks MATLAB 2014a compilation by rbgirshick · Pull Request #696 · BVLC/caffe](https://github.com/BVLC/caffe/pull/696/files)
- [Fix PowerLayer gradient check failures by reducing step size by shelhamer · Pull Request #1840 · BVLC/caffe](https://github.com/BVLC/caffe/pull/1840/files)
- [Clean flaky code by Yangqing · Pull Request #1264 · BVLC/caffe](https://github.com/BVLC/caffe/pull/1264/files)
- [Ubuntu + gcc-4.8 problems](https://software.intel.com/en-us/forums/intel-math-kernel-library/topic/499180)
- [Problems running test with MKL · Issue #1289 · BVLC/caffe](https://github.com/BVLC/caffe/issues/1289)
- [Caffe + Tensorflow + CentOS7.0 + K80 配置 - 弓长三 - CSDN博客](http://blog.csdn.net/gongchangsan/article/details/52904078)

# 后记

这是我第一次写博客。这篇文章本已经在简书上写完，却迟迟没有发表，后来某天心血来潮想搭一个自己的博客，然后这篇文章就顺理成章地发表在自己的博客上了，能把自己的成果展示出来也是一件令人开心的事吧。