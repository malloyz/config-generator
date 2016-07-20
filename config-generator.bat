@echo off
rem 文件存放路径
set fileStorePath=%cd%/data
rem excel文件目录
set excelRootPath=%cd%/excel
node tools/configObject-generator/generator.js %fileStorePath%/ %excelRootPath% configObject