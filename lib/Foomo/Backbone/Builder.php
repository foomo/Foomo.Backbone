<?php

/*
 * This file is part of the foomo Opensource Framework.
 *
 * The foomo Opensource Framework is free software: you can redistribute it
 * and/or modify it under the terms of the GNU Lesser General Public License as
 * published  by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * The foomo Opensource Framework is distributed in the hope that it will
 * be useful, but WITHOUT ANY WARRANTY; without even the implied warranty
 * of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License along with
 * the foomo Opensource Framework. If not, see <http://www.gnu.org/licenses/>.
 */

namespace Foomo\Backbone;
use Foomo\Modules\MakeResult;
use Foomo\TypeScript;

/**
 * @link www.foomo.org
 * @license www.gnu.org/licenses/lgpl.txt
 */
class Builder
{
	public static function buildFoomoBackboneJS()
	{
		TypeScript::create(Module::getBaseDir('typescript') . DIRECTORY_SEPARATOR . 'foomo-backbone.ts')
			->generateDeclaration()
			->addOutputFilter(
				function($output) {
					return str_replace('var Backbone;', '//var Backbone; <-- ie8 fix @microsoft(r)(tm) if anyone should not break it for IE8, that would be you!', $output);
				}
			)
			->out($generatedJSFile = Module::getBaseDir('typescript') . DIRECTORY_SEPARATOR . 'foomo-backbone.js')
			->compile()
		;
		self::tweakAndWriteGeneratedJS(
			$generatedJSFile,
			self::moveSourceMapToRightPlace($generatedJSFile)
		);
	}
	private static function moveSourceMapToRightPlace($generatedJSFile)
	{
		$generatedSourceMapFile = $generatedJSFile . '.map';
		$generatedSourceMapLocation = \Foomo\Backbone\Module::getHtdocsPath($targetMapName = 'js/foomo-backbone.js.map');
		file_put_contents(
			$file = \Foomo\Backbone\Module::getHtdocsDir() . DIRECTORY_SEPARATOR . $targetMapName,
			$map = file_get_contents($generatedSourceMapFile)
		);
		unlink($generatedSourceMapFile);
		return $generatedSourceMapLocation;
	}

	private static function tweakAndWriteGeneratedJS($generatedJSFile, $generatedSourceMapLocation)
	{
		$targetJSFile = Module::getHtdocsDir('js') . DIRECTORY_SEPARATOR . 'foomo-backbone.js';

		$newContents = self::setSourceMapLocation($generatedJSFile, $generatedSourceMapLocation);
		$oldContents = null;

		if(file_exists($targetJSFile)) {
			$oldContents = file_get_contents($targetJSFile);
		}
		if($oldContents != $newContents) {
			file_put_contents($targetJSFile, $newContents);
		}
		unlink($generatedJSFile);
	}
	private static function setSourceMapLocation($jsFilename, $sourceMapLocation)
	{
		$jsLines = explode(PHP_EOL, trim(file_get_contents($jsFilename)));
		array_pop($jsLines);
		$jsLines[] = '//# sourceMappingURL=' . $sourceMapLocation;
		return implode(PHP_EOL, $jsLines);
	}
}