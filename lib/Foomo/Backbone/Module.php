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
class Module extends \Foomo\Modules\ModuleBase
{
	//---------------------------------------------------------------------------------------------
	// ~ Constants
	//---------------------------------------------------------------------------------------------
	const VERSION = '0.2.0';
	/**
	 * the name of this module
	 *
	 */
	const NAME = 'Foomo.Backbone';

	//---------------------------------------------------------------------------------------------
	// ~ Overriden static methods
	//---------------------------------------------------------------------------------------------

	/**
	 * Your module needs to be set up, before being used - this is the place to do it
	 */
	public static function initializeModule()
	{
	}

	/**
	 * Get a plain text description of what this module does
	 *
	 * @return string
	 */
	public static function getDescription()
	{
		return 'our backbone contribution';
	}

	/**
	 * get all the module resources
	 *
	 * @return \Foomo\Modules\Resource[]
	 */
	public static function getResources()
	{
		return array(
			\Foomo\Modules\Resource\Module::getResource('Foomo.TypeScript', '0.1.*')
		);
	}
	public static function make($target, MakeResult $result)
	{
		switch($target) {
			case 'all':
				$ts = TypeScript::create(self::getBaseDir('typescript') . DIRECTORY_SEPARATOR . 'foomo-backbone.ts')
					->watch()
					->generateDeclaration()
					->compile()
				;
				$generatedJSFile = $ts->getOutputFilename();
				$targetJSFile = self::getHtdocsDir('js') . DIRECTORY_SEPARATOR . 'foomo-backbone.js';
				$newContents = file_get_contents($generatedJSFile);
				$oldContents = null;
				if(file_exists($targetJSFile)) {
					$oldContents = file_get_contents($targetJSFile);
				}
				if($oldContents != $newContents) {
					file_put_contents($targetJSFile, $newContents);
					unlink($generatedJSFile);
				}
				break;
			default:
				parent::make($target, $result);
		}
	}
}