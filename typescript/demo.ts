///<reference path='underscore.d.ts' />
///<reference path='backbone.d.ts' />
///<reference path='components.ts' />
///<reference path='behaviours.ts' />
///<reference path='controls.ts' />

import Comps = Backbone.Components;
import Behavs = Backbone.Components.Behaviours;
import Controls = Backbone.Components.Controls;

class TagEditorFactory {
	constructor(public prop:string) {
	}
	public factory(element:JQuery, view:Backbone.View):TagEditor {
		var tagEditor:TagEditor = TagEditor.factory(element, view, this.prop);
		return tagEditor;
	}
}

class Tag extends Backbone.View {
	static model = Backbone.Model;
	constructor(options?) {
		this.events = {
			"click .delete" : "handleDelete"
		}
		super(options);
		var el = $('<li><span class="text"></span> <span class="delete">del</span></li>');
		el.find('.text').text(this.model.get('value'));
		this.$el.html(el);
	}
	private handleDelete() {
		this.trigger('delete', this.model);
	}
}

class TagEditor extends Comps.BaseComponent {
	private comps: {
		inputTag?:Controls.Input;
		tagList?:Comps.List;
	};
	constructor(options?:{}) {
		super(options);
	}
	private init() {
		this.comps = Comps.mapToView(this,[
			Controls.Input.map('.control'),
			Comps.List.map('#tagList', Tag, this.attribute)
				.addBehaviour(Behavs.ListItemEventHandler.getFactory('delete', this.handleDelete))
		]);
		this.comps.inputTag.on('change', (input:Controls.Input) => {
			var newTags = _.clone(this.model.get(this.attribute));
			newTags.push(input.getValue());
			this.comps.inputTag.setValue('');
			this.model.set(this.attribute, newTags);
		}, this);
	}
	private handleDelete(data) {
		this.view.model.set(this.attribute, _.without(this.view.model.get(this.attribute), data.get('value')));
	}
	public static factory(element:JQuery, view:Backbone.View, attribute:string):TagEditor {
		var comp:TagEditor;
		if(element.length == 1) {
			comp = new TagEditor({model:view.model});
			comp.attribute = attribute;
			var replace = element.children().length == 0;
			if(replace) {
				comp.$el.html(window['TagEditorTemplate']({}));
			} else {
				comp.setElement(element);
			}
			comp.init();
			comp.id = element.prop('id');
			comp.view = view;
			if(replace) {
				element.replaceWith(comp.$el);
			}
		}
		return comp;
	}
	public getValue():string[]
	{
		return this.view.model.get(this.attribute);
	}
	public setValue(value:string[]) {
		// my list does that for me
	}
	public static map(selector, attribute) {
		return new Comps.Mapping(
			selector,
			(element:JQuery, view:Backbone.View):TagEditor => {
				var tagEditor:TagEditor = TagEditor.factory(element, view, attribute);
				return tagEditor;
			},
			[]
		);
	}
}


class DemoModel extends Backbone.Model {
	public feedback:Behavs.FeedbackModel;
	constructor(options?) {
		super(options);
		this.feedback = new Behavs.FeedbackModel;
		this.on('change', () => {
			if(this.attributes.foo == 'bar') {
				this.feedback.giveFeedback(
					'foo',
					'no bar !',
					Behavs.Feedback.LEVEL_ERROR
				);
			} else {
				this.feedback.giveFeedback(
					'foo',
					'ok',
					Behavs.Feedback.LEVEL_OK
				);
			}
		});
	}
	defaults() {
		return {
			foo: "Hello Foo",
			bar: "Hello Bar",
			booBool: true,
			superBool: {
				value: "Hello",
				checked: true
			},
			years: [
				{
					value: 1991,
					label: "Year 1991"
				},
				{
					value: 1992,
					label: "Year 1991 + 1"
				}
			],
			tags : [
				'foo', 'bar', 'boo'
			],
			moreTags : []
		}
	}
}


class DemoView extends Backbone.View {

	static robert = new Backbone.Model;
	model:DemoModel;
	public comps: {
		inputFoo?:Controls.Input;
		inputBar?:Controls.Input;
		inputBoo?:Controls.Input;
		inputSelectYear?: Controls.Select;
		inputSelectMonth?: Controls.Select;
		inputSelectDay?: Controls.Select;
		tagEditor?: TagEditor;
		checkBooBool?: Controls.Checkbox;
		displaySuperBool?:Comps.Display;
	};
	constructor(el) {
		super({});
		this.setElement(el);
		this.$el.html(window['DemoViewTemplate']({}));
		this.model = new DemoModel();
		this.comps = Comps.mapToView(this,[
			Controls.Input.map('.control')
				.addBehaviour(Behavs.ComponentFeedback.getFactory(this.model.feedback))
				.addBehaviour(Controls.Behaviours.TypeToChange.factory)
			,
			Controls.Select.mapWithOptionsFrom('#inputSelectYear', this.model, 'years'),
			TagEditor.map('#tagEditor', 'tags'),
			TagEditor.map('#twoTag', 'moreTags'),
			Comps.Display.map('.current-text'),
			Comps.Display.mapWithFilter('.current-bool', (data:any) => {
				if(typeof data == 'boolean') {
					return data?'yes':'no';
				}
				if(data && data.value) {
					return data.value + (data.checked?' is checked':' is not checked');
				} else {
					return '';
				}
			})
		]);
		this.comps.inputBoo
			.when('change:foo', this.model)//DemoView.robert)
			.then((model, component) => {
				if(model.get('foo') == 'hello') {
					this.$('div').css({border: '1px red solid'});
				} else {
					this.$('div').css({border: 'none'});
				}
			}
		);
		this.model.clear().set(this.model.defaults());
	}
}




























class SimpleModel extends Backbone.Model {
	public feedback:Behavs.FeedbackModel;
	constructor(defaults?) {
		super(defaults);
		this.feedback = new Behavs.FeedbackModel;
		this.on('change', this.test, this);
	}
	test() {
		var foo = this.get('foo');
		if(foo.length == 0) {
			this.feedback.giveFeedback(
				'foo',
				'must not be empty',
				Behavs.Feedback.LEVEL_ERROR
			);
		} else {
			this.feedback.giveFeedback(
				'foo',
				'',
				Behavs.Feedback.LEVEL_OK
			);

		}
	}
	default() {
		return {
			foo:'Hello',
			bar: '',
			options: ['a', 'b', 'c']
		};
	}

}







class Simple extends Backbone.View {
	model: SimpleModel;
	components: {
		inputFoo?:Controls.Input;
		selectBar?:Controls.Select;
		displayFoo?:Comps.Display;
	};
	constructor() {
		super({});
		this.model = new SimpleModel();
		this.setElement($('body'));
		this.$el.html(window['SimpleTemplate']({}));
		this.components = Backbone.Components.mapToView(this, [
			Comps.Display.map('h1'),
			Comps.Display.mapWithFilter('div span.filter-object', (data:any) => {
				var ret = '- not set -';
				_.each(this.model.get('options'), (option:{value:any; label:string;}) => {
					if(data == option.value) {
						ret = option.label;
					}
				});
				return ret;
			}),
			Controls.Input.map('div')
				.addBehaviour(Controls.Behaviours.TypeToChange.factory)
				.addBehaviour(Behavs.ComponentFeedback.getFactory(this.model.feedback))
			,
			Controls.Select.mapWithOptionsFrom('div', this.model, 'options')
		]);
		this.components.displayFoo.filter = (data:any) => {
			return data?data:'--<b>hhh</b>--';
		}
	}
}

$(document).ready(() => {
	// window['demoView'] = new DemoView($('body'));
	/*
	window['simple'] = new Simple();
	window['simple'].model.set({
		foo: 'Hello',
		bar: '',
		options: [
			{value: 1, label: "eins"},
			{value: 2, label: "zwei"},
			{value: 3, label: "drei"}
		]
	});
	*/
});





































