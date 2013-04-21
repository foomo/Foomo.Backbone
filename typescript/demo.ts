///<reference path='underscore.d.ts' />
///<reference path='backbone.d.ts' />
///<reference path='components.ts' />

import Components = Foomo.Backbone.Components;

class TagEditorFactory {
	constructor(public prop:string) {
	}
	public factory(element:JQuery, view:_Backbone.View):TagEditor {
		var tagEditor:TagEditor = TagEditor.factory(element, view);
		if(tagEditor) {
			tagEditor.prop = this.prop;
		}
		return tagEditor;
	}
}

class TagEditor extends Components.BaseComponent {
	private components: {
		inputTag?:Components.TextInput;
	};
	constructor(options?:{}) {
		super(options);
	}
	private init() {
		this.components = Components.populateView(this,[
			Components.TextInput.map('.control')
		]);
		this.components.inputTag.on('change', (value) => {
			var newTags = _.clone(this.model.get(this.prop));
			newTags.push(value)
			this.components.inputTag.val('');
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

	public val(value?:any):any {
		if(typeof value == 'undefined') {
			return this.view.model.get(this.prop);
		} else {
			var tagsEl = this.$('ul.tags')
				.empty()
			;
			_.each(value, (tag:string) => {
				tagsEl.append($('<li></li>').text(tag));
			});
		}
	}

	public static map(selector, prop) {
		return new Components.Mapping(
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
	public feedback:Components.FeedbackModel;
	constructor(options?) {
		super(options);
		this.feedback = new Components.FeedbackModel;
		this.on('change', () => {
			if(this.attributes.foo == 'bar') {
				this.feedback.giveFormFeedback(
					'foo',
					'no bar !',
					Components.Feedback.LEVEL_ERROR
				)
			}
		});
	}
	defaults() {
		return {
			foo: "Hello Foo",
			bar: "Hello Bar",
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
	public components: {
		inputFoo?:Components.TextInput;
		inputBar?:Components.TextInput;
		inputBoo?:Components.TextInput;
		inputSelectYear?: Components.Select;
		inputSelectMonth?: Components.Select;
		inputSelectDay?: Components.Select;
		tagEditor?: TagEditor;
	};
	constructor(el) {
		super({});
		this.setElement(el);
		this.$el.html(window['DemoViewTemplate']({}));
		this.model = new DemoModel();
		this.components = Components.populateView(this,[
			Components.TextInput.map('.control')
				.addBehaviour(Components.ComponentFeedback.getFactory(this.model.feedback))
			,
			Components.Select.mapWithOptionsFrom('#inputSelectYear', this.model, 'years'),
			TagEditor.map('#tagEditor', 'tags'),
			TagEditor.map('#twoTag', 'moreTags'),
			Components.Display.map('.current')
		]);
		this.components.inputBoo
			.when('change:foo', this.model)//DemoView.robert)
			.then((model, component) => {
				if(model.get('foo') == 'hello') {
					// component.element.hide();
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
