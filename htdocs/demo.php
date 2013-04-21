<?php

$doc = \Foomo\HTMLDocument::getInstance()
	->addJavascripts(array(
		Foomo\JS::create(Foomo\Backbone\Module::getHtdocsDir('js') . DIRECTORY_SEPARATOR . 'bootstrap.js')
			->watch()
			->compile()
			->getOutputPath()
		,
		Foomo\TypeScript::create(Foomo\Backbone\Module::getBaseDir('typescript') . DIRECTORY_SEPARATOR . 'demo.ts')
			->displayCompilerErrors()
			->compile()
			->getOutputPath()
	))
	->addStylesheet('
		.feedback-error {
			color:red;
		}
		.tagEditor {
			background-color: grey;
		}
		.tagEditor ul li {
			list-style:none;
			border: 1px solid black;
			background-color: white;
			width: 100px;
			padding:10px;
			margin:10px;
			cursor: pointer;
		}
	')
;

foreach(new DirectoryIterator(\Foomo\Backbone\Module::getBaseDir('typescript/demo')) as $fileInfo) {
	$filename = $fileInfo->getPathname();
	if(substr($filename, -5) == '.html') {
		$name = substr(basename($filename), 0, -5);
		$doc->addJavascript('window.' . $name . 'Template = _.template(' .  json_encode(file_get_contents($filename)) . ');');
	}
}

echo $doc;
