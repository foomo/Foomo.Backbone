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

use Foomo\Config;
use Foomo\JS\Bundle as JSBundle;
use Foomo\TypeScript\Bundle as TypeScriptBundle;

/**
 * @link www.foomo.org
 * @license www.gnu.org/licenses/lgpl.txt
 */
class JSBundles
{
	/**
	 * underscore, jquery, backbone
	 *
	 * @return JSBundle
	 */
	public static function backbone($debug = null)
	{
		$debug = self::getDebug($debug);
		return JSBundle::create('backbone')
			->debug($debug)
			->addJavaScript(Module::getHtdocsDir('js') . DIRECTORY_SEPARATOR . 'foomo-backbone-dependencies.js')
		;
	}

	public static function backboneComponents($debug = null)
	{
		$debug = self::getDebug($debug);
		return TypeScriptBundle::create(
				'foomo-backbone-components',
				Module::getBaseDir('typescript') . DIRECTORY_SEPARATOR . 'components'
			)
			->debug($debug)
			->writeTypeDefinition()
			->merge(self::backbone($debug))
		;
	}
	private static function getDebug($debug)
	{
		if(is_null($debug)) {
			$debug = !Config::isProductionMode();
		}
		return $debug;
	}
}