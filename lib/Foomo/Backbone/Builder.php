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

use Foomo\JS\Bundle\Compiler;


/**
 * @link www.foomo.org
 * @license www.gnu.org/licenses/lgpl.txt
 */
class Builder
{
	public static function buildFoomoBackboneJS()
	{
		$devResult = Compiler::compile(
			JSBundles::backboneComponents()
				->debug(false)
		);
		file_put_contents(
			Module::getHtdocsDir('js') . DIRECTORY_SEPARATOR . 'foomo-backbone.js',
			file_get_contents($devResult->jsFiles[0])
		);
		/*
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
		*/
	}

}