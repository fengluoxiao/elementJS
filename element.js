class Element {
  constructor(tag, textStyle) {
    this.element = document.createElement(tag);
    
    // 处理文本样式
    if (textStyle) {
      if (Array.isArray(textStyle)) {
        // 创建一个文本节点
        const textNode = document.createTextNode('');
        this._styleElement = textNode;
        
        // 从内到外嵌套样式标签
        let currentElement = textNode;
        textStyle.forEach(style => {
          const styleElement = document.createElement(style);
          styleElement.appendChild(currentElement);
          currentElement = styleElement;
        });
        
        this.element.appendChild(currentElement);
      } else {
        // 单个样式的处理
        const styleElement = document.createElement(textStyle);
        this.element.appendChild(styleElement);
        this._styleElement = styleElement;
      }
    }

    this.isRendered = false;
    this._data = null;
    this._key = null;
    this._template = null;
    this._hasWarnedAboutId = false;
    this._hasSetId = false;
    this._pressTimer = null;
    this.element.__element_instance = this;
  }

  style(styles) {
    Object.assign(this.element.style, styles);
    return this;
  }

  text(content) {
    if (content !== null && content !== undefined) {
      if (content && content.__isDataBinding) {
        this._data = content.__data;
        this._key = content.__key;
        if (this._styleElement) {
          this._styleElement.textContent = this._data[this._key];
        } else if (this.element.tagName.toLowerCase() === 'input') {
          this.element.value = this._data[this._key];
        } else {
          this.element.textContent = this._data[this._key];
        }
      } else {
        if (this._styleElement) {
          this._styleElement.textContent = content;
        } else if (this.element.tagName.toLowerCase() === 'input') {
          this.element.value = content;
        } else {
          this.element.textContent = content;
        }
      }
    }
    return this;
  }

  _updateText() {
    if (this._data) {
      if (this._key) {
        if (this.element.tagName.toLowerCase() === 'input') {
          this.element.value = this._data[this._key];
        } else {
          this.element.textContent = this._data[this._key];
        }
      } else {
        const value = Object.values(this._data)[0];
        if (this.element.tagName.toLowerCase() === 'input') {
          this.element.value = value;
        } else {
          this.element.textContent = value;
        }
      }
    }
  }

  _setupDataProxy() {
    if (this._data) {
      const self = this;
      const key = this._key || Object.keys(this._data)[0];
      const value = this._data[key];

      if (!this._data.__isProxySet) {
        Object.defineProperty(this._data, key, {
          get() {
            return value;
          },
          set(newValue) {
            const children = Array.from(self.element.children);
            self.element.childNodes.forEach(node => {
              if (node.nodeType === 3) {
                node.textContent = newValue;
              }
            });
            if (!Array.from(self.element.childNodes).some(node => node.nodeType === 3)) {
              self.element.insertBefore(document.createTextNode(newValue), self.element.firstChild);
            }
          }
        });
        this._data.__isProxySet = true;
      }
    }
  }

  onclick(fn) {
    const self = this;
    this.element.addEventListener('click', function(event) {
      event.stopPropagation();
      self.siblings().forEach(sibling => {
        sibling.removeClass('active');
      });
      self.addClass('active');
      fn.call(self, event);
    });
    return this;
  }

  addClass(...classNames) {
    this.element.classList.add(...classNames);
    return this;
  }

  removeClass(...classNames) {
    this.element.classList.remove(...classNames);
    return this;
  }

  toggleClass(className) {
    this.element.classList.toggle(className);
    return this;
  }

  attr(name, value) {
    if (typeof name === 'object') {
      Object.entries(name).forEach(([key, val]) => {
        this.element.setAttribute(key, val);
      });
      return this;
    }
    
    if (value === undefined) {
      return this.element.getAttribute(name);
    }
    
    this.element.setAttribute(name, value);
    return this;
  }

  on(eventName, handler) {
    this.element.addEventListener(eventName, (event) => {
      event.stopPropagation();
      handler(event);
    });
    return this;
  }

  fadeIn(duration = 300) {
    this.element.style.opacity = '0';
    this.element.style.transition = `opacity ${duration}ms`;
    setTimeout(() => this.element.style.opacity = '1', 0);
    return this;
  }

  fadeOut(duration = 300) {
    this.element.style.opacity = '1';
    this.element.style.transition = `opacity ${duration}ms`;
    setTimeout(() => this.element.style.opacity = '0', 0);
    return this;
  }

  animate(keyframes, options) {
    this.element.animate(keyframes, options);
    return this;
  }

  bind(key, value) {
    this._data[key] = value;
    this._updateView();
    return this;
  }

  _updateView() {
    if (this._template) {
      let content = this._template;
      for (const [key, value] of Object.entries(this._data)) {
        content = content.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
      }
      this.element.innerHTML = content;
    }
    return this;
  }

  template(html) {
    this._template = html;
    this._updateView();
    return this;
  }

  html(content) {
    this.element.innerHTML = content;
    return this;
  }

  width(value) {
    this.element.style.width = typeof value === 'number' ? `${value}px` : value;
    return this;
  }

  height(value) {
    this.element.style.height = typeof value === 'number' ? `${value}px` : value;
    return this;
  }

  position(pos) {
    this.element.style.position = pos;
    return this;
  }

  show() {
    this.element.style.display = '';
    return this;
  }

  hide() {
    this.element.style.display = 'none';
    return this;
  }

  toggle() {
    if (this.element.style.display === 'none') {
      this.show();
    } else {
      this.hide();
    }
    return this;
  }

  append(...children) {
    children.forEach(child => {
      if (child instanceof Element) {
        this.element.appendChild(child.element);
      } else if (typeof child === 'object' && child !== null) {
        Object.values(child).forEach(subChild => {
          if (subChild instanceof Element) {
            this.element.appendChild(subChild.element);
          } else {
            this.element.appendChild(subChild);
          }
        });
      } else {
        this.element.appendChild(child);
      }
    });
    return this;
  }

  render(container) {
    try {
      if (this.isRendered) {
        const targetContainer = document.querySelector(container);
        if (targetContainer) {
          targetContainer.innerHTML = '';
        }
        throw new Error('This node has already been rendered');
      }
      const targetContainer = document.querySelector(container);
      if (!targetContainer) {
        throw new Error(`Container ${container} not found`);
      }

      this._checkId();
      
      targetContainer.appendChild(this.element);
      this.isRendered = true;
      return this;
    } catch (error) {
      const targetContainer = document.querySelector(container);
      if (targetContainer) {
        targetContainer.innerHTML = '';
      }
      console.error('%c' + error.message, 'color: red; font-weight: bold;');
      throw error;
    }
  }

  className(name) {
    if (name === undefined) {
      return this.element.className;
    }
    
    if (name === '') {
      this.element.className = '';
      return this;
    }

    if (typeof name === 'string') {
      this.element.className = name;
      return this;
    }

    if (Array.isArray(name)) {
      this.element.className = name.join(' ');
      return this;
    }

    if (typeof name === 'object') {
      const classNames = Object.entries(name)
        .filter(([_, value]) => value)
        .map(([key, _]) => key);
      this.element.className = classNames.join(' ');
      return this;
    }

    return this;
  }

  addId(id) {
    try {
      if (id === undefined) {
        return this.element.id;
      }
      
      if (id === '') {
        this.element.id = '';
        this._hasSetId = false;
        return this;
      }

      if (typeof id === 'string') {
        if (this._hasSetId) {
          const appContainer = document.querySelector('#app');
          if (appContainer) {
            appContainer.innerHTML = '';
          }
          throw new Error(
            `不允许多次设置ID！元素已经设置了ID "${this.element.id}"，` +
            `不能再设置新ID "${id}"。每个元素只能设置一次ID。`
          );
        }

        if (document.getElementById(id)) {
          console.warn(
            `%c警告: ID "${id}" 已经存在于页面中。\n` +
            `重复的 ID 可能会导致问题。建议使用唯一的 ID。`,
            'color: #ff9800; font-weight: bold;'
          );
        }

        this.element.id = id;
        this._hasSetId = true;
      }

      return this;
    } catch (error) {
      throw error;
    }
  }

  static getElementById(id) {
    const element = document.getElementById(id);
    if (!element) return null;

    const el = new Element(element.tagName.toLowerCase());
    el.element = element;
    el.isRendered = true;
    return el;
  }

  _checkId() {
    if (!this.element.id && !this._hasWarnedAboutId) {
      console.warn(
        `%c建议为 <${this.element.tagName.toLowerCase()}> 元素添加 ID\n` +
        `可以使用 .addId("yourId") 来添加。\n` +
        `当前元素内容: ${this.element.textContent || this.element.innerHTML || '空'}`,
        'color: #ff9800; font-weight: bold;'
      );
      this._hasWarnedAboutId = true;
    }
  }

  onmouseover(fn) {
    this.element.addEventListener('mouseover', (event) => {
      event.stopPropagation();
      this.siblings().forEach(sibling => {
        sibling.removeClass('active');
      });
      this.addClass('active');
      fn.call(this, event);
    });
    return this;
  }

  onmouseout(fn) {
    this.element.addEventListener('mouseout', (event) => {
      event.stopPropagation();
      this.siblings().forEach(sibling => {
        sibling.removeClass('active');
      });
      this.addClass('active');
      fn.call(this, event);
    });
    return this;
  }

  onmousedown(fn) {
    this.element.addEventListener('mousedown', (event) => {
      event.stopPropagation();
      this.siblings().forEach(sibling => {
        sibling.removeClass('active');
      });
      this.addClass('active');
      fn.call(this, event);
    });
    return this;
  }

  onmouseup(fn) {
    this.element.addEventListener('mouseup', (event) => {
      event.stopPropagation();
      this.siblings().forEach(sibling => {
        sibling.removeClass('active');
      });
      this.addClass('active');
      fn.call(this, event);
    });
    return this;
  }

  onlongpress(fn, duration = 500) {
    this.element.addEventListener('mousedown', (event) => {
      event.stopPropagation();
      this._pressTimer = setTimeout(() => {
        this.siblings().forEach(sibling => {
          sibling.removeClass('active');
        });
        this.addClass('active');
        fn.call(this, event);
      }, duration);
    });

    this.element.addEventListener('mouseup', (event) => {
      event.stopPropagation();
      clearTimeout(this._pressTimer);
    });

    this.element.addEventListener('mouseout', (event) => {
      event.stopPropagation();
      clearTimeout(this._pressTimer);
    });

    return this;
  }

  // 添加排他处理方法
  siblings() {
    const parent = this.element.parentElement;
    if (!parent) return [];
    return Array.from(parent.children)
      .filter(child => child !== this.element)
      .map(child => child.__element_instance);
  }

  // 添加默认业务处理方法
  defaultDo(fn) {
    // 执行默认的业务逻辑
    fn.call(this);
    return this;
  }

  // 添加删除所有类名的方法
  removeAllClass() {
    this.element.className = '';
    return this;
  }

  // 添加 onmousemove 方法
  onmousemove(fn) {
    this.element.addEventListener('mousemove', (event) => {
      event.stopPropagation();
      // 移除兄弟元素的 active 类
      this.siblings().forEach(sibling => {
        sibling.removeClass('active');
      });
      // 给当前元素添加 active 类
      this.addClass('active');
      fn.call(this, event);
    });
    return this;
  }

  // 添加鼠标右击事件
  oncontextmenu(fn) {
    this.element.addEventListener('contextmenu', (event) => {
      event.preventDefault();  // 阻止默认的右键菜单
      event.stopPropagation();
      // 移除兄弟元素的 active 类
      this.siblings().forEach(sibling => {
        sibling.removeClass('active');
      });
      // 给当前元素添加 active 类
      this.addClass('active');
      fn.call(this, event);
    });
    return this;
  }

  // 添加 value 方法来获取文本内容
  value() {
    if (this.element.tagName.toLowerCase() === 'input') {
      return this.element.value;
    }
    return this.element.textContent;
  }

  // 添加 setValue 方法来修改文本内容
  setValue(newValue) {
    if (this.element.tagName.toLowerCase() === 'input') {
      this.element.value = newValue;
    } else {
      this.element.textContent = newValue;
    }
    return this;
  }

  // 将 disable 改名为 isDisable
  isDisable(isDisabled = true) {
    // 检查元素是否支持 disabled 属性
    const disableableElements = ['input', 'button', 'select', 'textarea', 'optgroup', 'option'];
    
    if (disableableElements.includes(this.element.tagName.toLowerCase())) {
      if (isDisabled) {
        this.element.setAttribute('disabled', 'disabled');
        this.element.disabled = true;  // 添加 disabled 属性
      } else {
        this.element.removeAttribute('disabled');
        this.element.disabled = false;  // 移除 disabled 属性
      }
    } else {
      console.warn(
        `%c警告: <${this.element.tagName.toLowerCase()}> 元素不支持 disabled 属性`,
        'color: #ff9800; font-weight: bold;'
      );
    }
    return this;
  }

  // 删除单独的 href, method, action 方法
  // 添加统一的属性处理方法
  setAttr(name, value) {
    const supportedAttrs = {
      'a': ['href', 'target', 'rel'],
      'form': ['method', 'action', 'enctype'],
      'input': ['type', 'value', 'placeholder', 'name'],
      'img': ['src', 'alt'],
      'link': ['rel', 'href', 'type'],
      'meta': ['name', 'content'],
      'script': ['src', 'type', 'async', 'defer']
    };

    const tagName = this.element.tagName.toLowerCase();
    const supportedAttrList = supportedAttrs[tagName] || [];

    if (supportedAttrList.includes(name)) {
      this.element.setAttribute(name, value);
    } else {
      console.warn(
        `%c警告: <${tagName}> 元素不支持 ${name} 属性`,
        'color: #ff9800; font-weight: bold;'
      );
    }
    return this;
  }

  // 为了保持向后兼容，保留这些方法但使用 setAttr
  href(url) {
    return this.setAttr('href', url);
  }

  method(type) {
    return this.setAttr('method', type);
  }

  action(url) {
    return this.setAttr('action', url);
  }

  onSubmit(fn) {
    this.element.addEventListener('submit', (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      // 获取表单中所有带 name 属性的输入元素
      const formData = new FormData(this.element);
      const datas = {};
      
      // 将 FormData 转换为 JSON 对象
      formData.forEach((value, key) => {
        datas[key] = value;
      });
      
      // 将数据添加到 event 对象中
      event.submit = {
        datas: datas
      };
      
      fn.call(this, event);
    });
    return this;
  }
}

const html = new Proxy({}, {
  get: (target, tag) => (...args) => {
    const el = new Element(tag, args[1]);
    if (args.length > 0) {
      if (typeof args[0] === 'object' && args[0] !== null) {
        const value = args[0];
        value.__isDataBinding = true;
        el.text(value);
      } else {
        el.text(args[0]);
      }
    }
    return el;
  }
});

html.getElementById = Element.getElementById;

function render(elements, container = '#app') {
  try {
    if (!Array.isArray(elements)) {
      elements = [elements];
    }
    
    const targetContainer = document.querySelector(container);
    if (!targetContainer) {
      throw new Error(`Container ${container} not found`);
    }

    elements.forEach(element => {
      if (element.isRendered) {
        targetContainer.innerHTML = '';
        throw new Error('One or more nodes have already been rendered using .render()');
      }
      if (element instanceof Element) {
        element._checkId();
      }
    });

    elements.forEach(element => {
      if (element instanceof Element) {
        targetContainer.appendChild(element.element);
        element.isRendered = true;
      }
    });
  } catch (error) {
    const targetContainer = document.querySelector(container);
    if (targetContainer) {
      targetContainer.innerHTML = '';
    }
    console.error('%c' + error.message, 'color: red; font-weight: bold;');
    throw error;
  }
}

function refData(data) {
  // 递归创建代理
  function createProxy(obj) {
    return new Proxy(obj, {
      get(target, prop) {
        // 获取属性值
        const value = target[prop];

        // 如果是对象，递归创建代理
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          return createProxy(value);
        }

        // 如果是数组，返回数组的代理
        if (Array.isArray(value)) {
          return new Proxy(value, {
            get(arrayTarget, arrayProp) {
              if (typeof arrayProp === 'number' || !isNaN(parseInt(arrayProp))) {
                return {
                  __isDataBinding: true,
                  __data: arrayTarget,
                  __key: parseInt(arrayProp),
                  toString() {
                    return arrayTarget[arrayProp];
                  }
                };
              }
              if (arrayProp === 'length') {
                return arrayTarget.length;
              }
              if (typeof arrayTarget[arrayProp] === 'function') {
                return arrayTarget[arrayProp].bind(arrayTarget);
              }
              return arrayTarget[arrayProp];
            },
            set(arrayTarget, arrayProp, value) {
              arrayTarget[arrayProp] = value;
              document.querySelectorAll('*').forEach(el => {
                const elementInstance = el.__element_instance;
                if (elementInstance && 
                    elementInstance._data === arrayTarget && 
                    elementInstance._key === parseInt(arrayProp)) {
                  elementInstance.text(value);
                }
              });
              return true;
            }
          });
        }

        // 返回普通值的代理
        return {
          __isDataBinding: true,
          __data: target,
          __key: prop,
          toString() {
            return target[prop];
          }
        };
      },
      set(target, prop, value) {
        target[prop] = value;
        document.querySelectorAll('*').forEach(el => {
          const elementInstance = el.__element_instance;
          if (elementInstance && 
              elementInstance._data === target && 
              elementInstance._key === prop) {
            elementInstance.text(value);
          }
        });
        return true;
      }
    });
  }

  return createProxy(data);
} 