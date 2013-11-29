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

use Foomo\Bundle\Compiler;


/**
 * @link www.foomo.org
 * @license www.gnu.org/licenses/lgpl.txt
 */
class Builder
{
	public static function buildFoomoBackboneJS()
	{
		$devResult = Compiler::compile(
			JSBundles::backboneComponents(true)
		);
		$debugFilename = Module::getHtdocsDir('js') . DIRECTORY_SEPARATOR . 'foomo-backbone.js';
		if(file_exists($debugFilename)) {
			unlink($debugFilename);
		}
		$fp = fopen($debugFilename, 'a');
		foreach($devResult->resources as $resource) {
			fwrite($fp, file_get_contents($resource->file) . PHP_EOL);
		}
		fclose($fp);
		$devResult = Compiler::compile(
			JSBundles::backboneComponents(false)
		);
		file_put_contents(
			Module::getHtdocsDir('js') . DIRECTORY_SEPARATOR . 'foomo-backbone.min.js',
			file_get_contents($devResult->resources[0]->file)
		);

	}

}