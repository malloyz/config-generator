@echo on
rem �ļ����·��
set fileStorePath=%cd%/data
rem excel�ļ�Ŀ¼
set excelRootPath=%cd%/excel
node tools/configObject-generator/generator.js %fileStorePath%/ %excelRootPath% configObject debug
pause