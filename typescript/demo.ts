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
		var tagEditor:TagEditor = TagEditor.factory(element, view);
		if(tagEditor) {
			tagEditor.prop = this.prop;
		}
		return tagEditor;
	}
}

class TagEditor extends Comps.BaseComponent {
	private comps: {
		inputTag?:Controls.Input;
	};
	constructor(options?:{}) {
		super(options);
	}
	private init() {
		this.comps = Comps.mapToView(this,[
			Controls.Input.map('.control')
		]);
		this.comps.inputTag.on('change', (input:Controls.Input) => {
			var newTags = _.clone(this.model.get(this.prop));
			newTags.push(input.getValue());
			this.comps.inputTag.setValue('');
			this.model.set(this.prop, newTags);
		}, this);
	}
	public static factory(element:JQuery, view:Backbone.View):TagEditor {
		var comp:TagEditor;
		if(element.length == 1) {
			comp = new TagEditor({model:view.model});
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
		return this.view.model.get(this.prop);
	}
	public setValue(value:string[]) {
		var tagsEl = this.$('ul.tags')
			.empty()
		;
		_.each(value, (tag:string) => {
			tagsEl.append($('<li></li>').text(tag));
		});
	}
	public static map(selector, prop) {
		return new Comps.Mapping(
			selector,
			(element:JQuery, view:Backbone.View):TagEditor => {
				var tagEditor:TagEditor = TagEditor.factory(element, view);
				if(tagEditor) {
					tagEditor.prop = prop;
				}
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
			superBool: false,
		/*{
				value: "Hello",
				checked: true
			},*/
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
	public Comps: {
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
		this.Comps = Comps.mapToView(this,[
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
		this.Comps.inputBoo
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

$(document).ready(() => {
	window['demoView'] = new DemoView($('body'));
});
