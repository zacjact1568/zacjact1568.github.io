---
title: 在 MATLAB 中使用 Dlib
slug: using-dlib-in-matlab
date: 2017-04-22
---

[Dlib](http://dlib.net/) 是一个机器学习的 C++ 工具包，可以使用 C++ 和 Python 两种语言调用。如果要在 MATLAB 中使用它的话，稍显麻烦。

这篇文章记录了我编译并使用 Dlib 的 MATLAB 接口的过程。

<!--more-->

# 下载 Dlib

从 GitHub 上 clone 源码：

```
$ git clone https://github.com/davisking/dlib.git
```

要注意的是，作者把使用说明基本上都写在了源码的注释中。

# 工具总览

{{< notice info >}}

MATLAB 是通过 MEX 调用 C++ 的，也就是说，需要将 C++ 源码编译成 MEX 格式，例如 64 位 Linux 下是 `.mexa64` 格式的文件，然后在 MATLAB 中 `addpath` 这个 MEX 格式文件所在的路径，就可以像调用内置函数一样调用 C++ 函数了。

{{< /notice >}}

Dlib 的作者提供了一个小工具，可以方便地编译 MATLAB 接口，在 `dlib/dlib/matlab` 中找到它。

此文件夹中有四个 `example` 开头的 C++ 文件，对应四个示例。其中，调用函数的例子 `example_mex_function.cpp` 如下：

```cpp
// The contents of this file are in the public domain. See LICENSE_FOR_EXAMPLE_PROGRAMS.txt

#include "dlib/matrix.h"
using namespace dlib;
using namespace std;


/*!
    This file defines a function callable from MATLAB once you mex it. 

    It computes the same thing as the following MATLAB function:

        function [A, B] = example_mex_function(x, y, some_number)
            A = x+y;
            B = sum(sum(x+y));
            disp(['some_number: ' num2str(some_number)])
        end


    VALID INPUT AND OUTPUT ARGUMENTS
        The mex wrapper can handle the following kinds of input and output arguments:
            - Types corresponding to a MATLAB matrix
                - a dlib::matrix containing any kind of scalar value.
                - a dlib::array2d containing any kind of scalar value.
                - a dlib::vector containing any kind of scalar value.
                - a dlib::point
                - matrix_colmajor or fmatrix_colmajor
                  These are just typedefs for matrix containing double or float and using a
                  column major memory layout.  However, they have the special distinction
                  of being fast to use in mex files since they sit directly on top of
                  MATLAB's built in matrices.  That is, while other types of arguments copy
                  a MATLAB object into themselves, the matrix_colmajor and fmatrix_colmajor
                  do no such copy and are effectively zero overhead methods for working on
                  MATLAB's matrices.

            - RGB color images
                - dlib::array2d<dlib::rgb_pixel> can be used to represent 
                  MATLAB uint8 MxNx3 images.

            - Types corresponding to a MATLAB scalar
                - any kind of scalar value, e.g. double, int, etc.

            - Types corresponding to a MATLAB string 
                - std::string 
        
            - Types corresponding to a MATLAB cell array
                - a std::vector or dlib::array containing any of the above 
                  types of objects or std::vector or dlib::array objects.

            - matlab_struct and matlab_object.  These are special types defined in the
              call_matlab.h file and correspond to matlab structs and arbitrary matlab
              objects respectively.
!*/


// You can also define default values for your input arguments.  So
// here we say that if the user in MATLAB doesn't provide the "some_number" 
// then it will get a value of 3.141.  
#define ARG_5_DEFAULT 3.141

// Make a function named mex_function() and put your code inside it.
// Note that the return type should be void.  Use non-const reference
// arguments to return outputs.  Finally, mex_function() must have no
// more than 20 arguments.
void mex_function (
    const matrix_colmajor& x,
    const matrix_colmajor& y,
    matrix_colmajor& out1,
    double& out2,
    double some_number 
) 
{
    out1 = x + y;
    out2 = sum(x+y);

    // we can also use cout to print things as usual:
    cout << "some_number: "<< some_number << endl;
}



// #including this brings in all the mex boiler plate needed by MATLAB.
#include "mex_wrapper.cpp"
```

使用说明都在这一大堆的注释里面了，主要说的就是：
- 可以在 MATLAB 和 C++ 之间传递的变量类型
- 定义输入参数的默认值的方法
- 函数定义方法：函数名必须为 `mex_function`，返回类型必须为 `void`，想返回数据的话，使用参数中的非常量引用代替，参数数量最多为 20
- 在最后添加 `#include "mex_wrapper.cpp"`（实测，添加到前面的话，编译的时候会报错）

还有一个 MATLAB 文件 `example.m`，这是从 MATLAB 调用 C++ 的示例，如下所示：

```matlab
% This example calls the three mex functions defined in this folder.  As you
% can see, you call them just like you would normal MATLAB functions.

x = magic(3)
y = 2*magic(3)

[out1, out2] = example_mex_function(x,y, 12345)

z = example_mex_callback(x, @(a)a+a)


input = {}
input.val = 2
input.stuff = 'some string'
output = example_mex_struct(input)
```

可见，在这个 MATLAB 文件中调用了 `example_mex_function.cpp`、
`example_mex_callback.cpp`、`example_mex_struct.cpp` 三个 C++ 文件中的函数（`mex_function`）。

以 `example_mex_function.cpp` 为例，调用这个 C++ 文件中的函数是在第 7 行：

```matlab
[out1, out2] = example_mex_function(x,y, 12345)
```

再看看 `example_mex_function.cpp` 中函数的定义为：

```cpp
void mex_function (
    const matrix_colmajor& x,
    const matrix_colmajor& y,
    matrix_colmajor& out1,
    double& out2,
    double some_number 
) 
```

参数、返回值的对应关系如下表所示：

| MATLAB | C++ |
|:------------:|:------------:|
| x | x |
| y | y |
| out1 | out1 |
| out2 | out2 |
| 12345 | some_number |

可见，MATLAB 调用 C++ 函数时，返回值是定义成 C++ 函数的非常量引用参数的，并不能直接在 C++ 函数中返回，因为 C++ 函数的返回值类型必须为 `void`。

另外，`matrix_colmajor` 是 Dlib 中一种特殊的矩阵（`matrix`）类型，以列主序存储 `double` 类型的元素（列主序存储 `float` / `single` 类型的元素用 `fmatrix_colmajor`），而 MATLAB 中的矩阵就是列主序的，这样可以不经过复制直接从 MATLAB 传入矩阵，可以减少开销。

{{< notice info >}}

要注意的是，这并不是通过 MATLAB 调用 C++ 的通用方法，只是 Dlib 提供了一些工具来帮助我们编译 MATLAB 接口。在我看来，只要按照格式编写函数，编译后就是标准的 MEX 文件，而其他的一些东西会在编译的时候按照一定规则自动生成。

{{< /notice >}}

# 编译接口

先修改一下 `cmake_mex_wrapper` 这个文件：

```cmake
# Find MATLAB's include directory and needed libraries 
find_program(MATLAB_EXECUTABLE matlab PATHS
        "C:/Program Files/MATLAB/*/bin"
        "C:/Program Files (x86)/MATLAB/*/bin"
        "/usr/local/MATLAB/R2014a" # 添加MATLAB的安装路径（我的是R2014a）
        )
```

不知道为什么作者这里只写了 Windows 下的安装路径……

然后安装 CMake 和 Fortran 编译器：

```
$ sudo apt-get install cmake
$ sudo apt-get install gfortran
```

打开此路径下的 `README.txt`，有编译教程：

```
$ mkdir build
$ cd build
$ cmake ..
$ cmake --build . --config release --target install
```

最后 install 的时候报错：

```
CMake Error at cmake_install.cmake:50 (file):
  file INSTALL destination: /home/zack/dlib/dlib/matlab/cmake_mex_wrapper is
  not a directory.
```

废话，`cmake_mex_wrapper` 当然不是个目录了，它是个文件啊。其实不安装也能用，可以直接无视之。如果不爽错误，最后一条命令换成

```
$ cmake --build . --config release
```

不执行 install 即可。

# 测试接口

在 `dlib/dlib/matlab` 使用 `matlab` 命令打开 MATLAB，在 MATLAB 中执行

```
>> addpath('build')
>> example
```

其中，`.mexa64` 文件都在 `build` 中，所以要用 `addpath` 将路径包含进去。

部分输出如下：

![部分输出](http://upload-images.jianshu.io/upload_images/1771371-1ffee2c49ed737e2.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

说明成功在 MATLAB 中调用了 C++。

# 后记

写这篇文章是因为自己的计算是在 MATLAB 中进行的，结果也是从 MATLAB 中输出，下一步需要使用 Dlib 对此结果进行计算。在 MATLAB 中直接调用 Dlib 的话，可以串成一个工作流，就不用后面单独在命令行里调用编译好的 Dlib 程序了。


