/*
  Auther:f7
  Date:2012.05
  Editor:2014.07.06
  Versions:2.3.4
  Note:修正所使用index参数时上下箭头样式没有初始化BUG
  去掉总宽度不是range倍数时的滚动修正，按照正常滚，在头尾采用浏览器自己的特性修正
*/

/**
 * 各种滚动
 * @name Scroll
 * @function
 * @grammar Scroll(elem[, options]) || new Scroll(elem[, options])
 * @param {ElementHTML || ID} 	elem 滚动节点或者滚动节点ID
 * @param {Object} 	[o] 选项参数
 * @config {String}  [move]  滚动的方向，默认向左 “W” [N|S|W|E]
 * @config {Number}  [speed]  滚动速率
 * @config {Boolean}  [auto]  是否自动滚动，默认滚动 “true”
 * @config {Boolean}  [animation]  是否动画滚动，默认为“true”
 * @config {Boolean}  [loop]  是否循环展示，默认滚动 “false”，用于在不滚动情况下点击箭头能循环出现内容
 * @config {Number}  [index]  初始化到滚动过多少像素
 * @config {Number}  [rest]  中间休息时间，该参数决定是否为间歇运动
 * @config {Number}  [range]  移动距离
 * @config {ElementHTML || ID}  [prev]  上一个按钮节点或者ID
 * @config {ElementHTML || ID}  [next]  下一个按钮节点或者ID
 * @config {ElementHTML || ID}  [slider]  触点ID，拥有此参数时会计算出有几屏切换并在该节点写入几个A标签，当前屏触点className为current
 * @config {String}  [mode]  触点切换的动作click||mouseover，仅在有slider参数时才生效
 * @config {Function}  [initCallback]  初始化完成HTML时执行的回调
 * @config {Function}  [callback]  间歇运动时，运动完成一个单元的回调函数
 */

function Scroll( elem, o ){
	if ( !(this instanceof Scroll) ) {
		return new Scroll( elem, o );
	};
	if ( !this.g(elem) ) { return false };
	this.o = o || {};
	this.elem = this.g(elem);
	this.prevElement = this.o.prev ? this.g(this.o.prev) : "";
	this.nextElement = this.o.next ? this.g(this.o.next) : "";
	this.move = this.o.move || "w";
	this.speed = this.o.speed || 30;
	this.o.auto === undefined ? this.o.auto = true : this.o.auto;
	this.o.animation === undefined ? this.o.animation = true : this.o.animation;
	this.o.loop === undefined ? this.o.loop = false : this.o.loop;
	this.o.mode === undefined ? this.o.mode = "click" : this.o.auto;
	
	this.modWidth = 0;// 原本模块初始宽度
	this.isStop = 0;
	this.timer = "";
	this.axes = this.o.move && ( this.o.move == "n" || this.o.move == "N" || this.o.move == "s" || this.o.move == "S" ) ? "scrollTop" : "scrollLeft";// 获取滚动的坐标轴
	this.isES = this.o.auto !== false && (this.o.move == "e" || this.o.move == "E" || this.o.move == "s" || this.o.move == "S"),// true 代表反向运动
	
	this.o.slider !== undefined ? this.o.range = this.axes == "scrollLeft" ? this.elem.clientWidth : this.elem.clientHeight : this.o.range;

	this.init();
};

Scroll.prototype.init = function(){
	var that = this,
		mytime = "",
		scroll = this.axes,
		index = parseInt(this.o.index || 0);
	
	if ( !this.initHTML() ) { return false };
	
	this.elem.onmouseover = function(){
		clearTimeout(mytime);
		that.stop();
	};
	this.elem.onmouseout = function(){
		mytime = setTimeout(function(){ that.start() }, 100);
	};
	
	this.prevElem();
	this.nextElem();
	
	this.resetPrevNext();
	this.slider();

	// 初始化滚动前的位置
	
	if ( /msie (\d+\.\d)/i.test(navigator.userAgent) == true ) {// IE下处理初始位置不正确BUG
		setTimeout(function(){initScroll()}, 15);
	} else {
		initScroll();
	};
	
	if ( this.o.initCallback ) { this.o.initCallback(that) };
	
	setTimeout(function(){that.action();}, this.o.rest || this.speed || 1000);
	
	// 处理浏览器页签失去焦点
	if ( window.addEventListener ) {
		window.addEventListener("focus", function(){ that.start() }, false);
		window.addEventListener("blur", function(){ that.stop() }, false);
	}/* else {// IE8及以下不存在失去焦点停止setTimeout问题，所以不必暂停
		window.attachEvent("onfocus", function(){ that.start() });
		window.attachEvent("onblur", function(){ that.stop() });
	}*/;

	function initScroll() {
		var _p = (that.o.auto === true || that.o.loop === true) && that.o.slider === undefined ?
		that.modWidth > 0 ?
			that.modWidth + index :
			that.elem.scrollHeight/2 + index
		:
		index;
		
		var _offset = that.axes == "scrollLeft" ? that.elem.offsetWidth : that.elem.offsetHeight,
			_scroll = that.axes == "scrollLeft" ? that.elem.scrollWidth : that.elem.scrollHeight;
		// 初始化index超出范围限制
		if (_p + _offset > _scroll ) {
			_p = _scroll - _offset;
		} else if ( _p < 0 ) {
			_p = 0;
		};
		
		that.elem[scroll] = _p;

		// 初始化索引完成后进行上下箭头重置
		that.resetPrevNext();
	}
	
};

Scroll.prototype.initHTML = function(){
	var contentHTML = this.elem.innerHTML,
		allWidthElem,
		innerWidthElem;
	
	if ( this.axes == "scrollTop" ) {// 纵向滚动
		if ( this.elem.scrollHeight <= parseInt(this.getStyle(this.elem, "height")) ) {// 检测是否符合效果基础条件
			return false;
		};
		if ( (this.o.auto === true || this.o.loop === true) && !this.o.slider ) {// 需要滚动
			this.elem.innerHTML += this.elem.innerHTML;
		};
	} else {// 横向滚动
		this.elem.style.textAlign = "left";
		allWidthElem = document.createElement("div");
		innerWidthElem = document.createElement("div");// 为了获取实际宽度而创建的节点，获取后会删掉
		allWidthElem.style.position = "absolute";
		allWidthElem.style.width = "99999px";
		(document.all) ? innerWidthElem.style.styleFloat="left" : innerWidthElem.style.cssFloat="left";
		this.elem.innerHTML = "";
		this.elem.appendChild(allWidthElem);
		allWidthElem.appendChild(innerWidthElem);
		innerWidthElem.innerHTML = contentHTML;
		this.modWidth = innerWidthElem.scrollWidth;
		allWidthElem.style.position = "";
		allWidthElem.style.overflow = "hidden";
		this.allWidthElem = allWidthElem;


		// if ( this.modWidth <= this.modWidth ) {// 检测是否符合效果基础条件
		// 	return false;
		// }
		
		if ( (this.o.auto === true || this.o.loop === true) && this.modWidth > parseInt(this.getStyle(this.elem, "width")) && !this.o.slider ) {// 需要滚动
			allWidthElem.innerHTML = contentHTML + contentHTML;
			allWidthElem.style.width = this.modWidth * 2 + "px";
		} else {
			allWidthElem.innerHTML = contentHTML;
			allWidthElem.style.width = this.modWidth + "px";
		};
	};
	
	return true;
};

// 处理可滑动的圆点【手柄，数字引导】
Scroll.prototype.slider = function(){
	if ( this.o.slider === undefined ) { return false };

	var elem = this.g(this.o.slider),
		showRange = this.elem.clientWidth,
		allRange = this.elem.scrollWidth,
		count,
		_a,
		_text,
		mytime = "",
		that = this,
		sliderTimer = "";

	if ( this.axes == "scrollTop" ) {
		showRange = this.elem.clientHeight,
		allRange = this.elem.scrollHeight;
	};
	count = Math.floor(allRange / showRange);
	if ( allRange % showRange > 0 ) {
		count++;
	};
	//this.axes == "scrollLeft" ? this.allWidthElem.style.height = count * showRange + "px" : this.allWidthElem.style.width = count * showRange + "px";
	if ( this.axes == "scrollLeft" ) {
		this.allWidthElem.style.width = count * showRange + "px";
	};
	for ( var i=0; i<count; i++ ) {
		_a = document.createElement("a");
		_a.setAttribute("href", "#");
		_text = document.createTextNode(i+1);
		elem.appendChild(_a);
		_a.appendChild(_text);

		_a.onclick = function() { return false };

		(function(i) {
			that.on(_a, that.o.mode, function(){
				
				if ( that.o.mode == "mouseover" ) {
					clearTimeout(sliderTimer);
					sliderTimer = setTimeout(function(){
						that.goToScreen(i);
						that.stop();
					}, 250);
				} else {
					that.goToScreen(i);
					that.stop();
				}
			});

			that.on(_a, "mouseover", function(){
				clearTimeout(mytime);
				that.stop();
			});
			that.on(_a, "mouseout", function(){
				clearTimeout(sliderTimer);
				mytime = setTimeout(function(){ that.start() }, 100);
			});
		})(i);
		
	};

	this.setSliderState();
};
// 焦点图模式时跳至第几屏
Scroll.prototype.goToScreen = function(count) {
	if ( this.o.slider === undefined ) { return false };
	var theCount,
		elem = this.g(this.o.slider),
		_as = elem.getElementsByTagName("a");

	for ( var i=0, l=_as.length; i<l; i++ ) {
		if ( _as[i].className == "current" ) {
			theCount = i;
		}
	};
	this.action(count - theCount);
	// this.action(count);
};
// 设置当前触点的状态
Scroll.prototype.setSliderState = function(){
	if ( this.o.slider === undefined ) { return false };

	var elem = this.g(this.o.slider),
		items = elem.getElementsByTagName("a"),
		showRange = this.elem.clientWidth,
		pastRange = this.elem[this.axes],
		count;
		
	if ( this.axes == "scrollTop" ) {
		showRange = this.elem.clientHeight;
	};
	count = Math.floor(pastRange/showRange);
	for ( var i=0, l=items.length; i<l; i++ ) {
		items[i].className = "";
	};
	items[count].className = "current";
	this.currentPage = count;
	if ( this.o.loadingStart ) this.o.loadingStart(this);// loadingStart回调

};

Scroll.prototype.action = function(c){
	if ( this.isStop == 1 && !c ) { return false };
	if ( c == 0 ) { return false };
	var that = this,
		scroll = this.axes,
		range = this.isES ? -parseInt(this.o.range) : parseInt(this.o.range),
		n = this.isES ? -1 : 1,
		finish;
		
	clearTimeout(this.timer);

	if ( that.o.loadingStop ) that.o.loadingStop(that);// loadingStop回调
	
	if ( c ) {// 上一个下一个
		this.isStop = 1;
		finish = this.elem[scroll] + parseInt(this.o.range) * c;
		
		animation();
	} else if ( this.o.rest ) {// 间歇运动
		this.isStop = 1;
		finish = this.elem[scroll] + range;
		animation();
	} else if ( !this.o.rest && this.o.auto != false )  {// 无缝运动
		this.elem[scroll] += n;
		that.resetScroll();
	};

	
	if ( this.o.auto != false ) {
		this.timer = this.o.rest ? setTimeout(function(){that.action()}, this.o.rest) : setTimeout(function(){that.action()}, this.speed);
		
	};

	function animation() {
		that.slowdown( finish, function() {
			scrollOver();
		} );
	};

	function scrollOver() {
		if ( that.o.callback ) that.o.callback(that);
		that.resetPrevNext();
		if ( that.o.slider === undefined ) { that.resetScroll() };
		that.setSliderState();
		
		that.isStop = 0;
	};
	
};

// 重置scroll距离
Scroll.prototype.resetScroll = function(){
	if ( this.o.auto === false && this.o.loop === false ) { return false };
	
	var start = this.modWidth > 0 ? this.modWidth : this.elem.scrollHeight/2,
		scroll = this.axes,
		showScope = this.modWidth > 0 ? this.elem.clientWidth : this.elem.clientHeight,
		scrollMax = this.modWidth > 0 ? this.modWidth * 2 - showScope : this.elem.scrollHeight - showScope;
	
	if ( this.elem[scroll] == 0) {
		this.elem[scroll] = start;
	};
	if ( this.elem[scroll] == scrollMax) {
		this.elem[scroll] = start - showScope;
	};
};

// 重置箭头样式
Scroll.prototype.resetPrevNext = function(){
	if ( this.o.auto === true || this.o.loop === true ) {return false };
	if ( this.o.slider !== undefined ) { return false };
	// 方向不同 是否需要设置上下按钮即样式
	if ( this.move == "w" || this.move == "W" || this.move == "e" || this.move == "E" ) {
		if ( this.elem.scrollWidth <= this.elem.offsetWidth ) return false;
	} else {
		if ( this.elem.scrollHeight <= this.elem.offsetHeight ) return false; 
	};
	
	var axes = this.axes,
		maxTopScope = this.modWidth > 0 ? this.modWidth : this.elem.scrollHeight,
		boxDcope = this.modWidth > 0 ? this.elem.clientWidth : this.elem.clientHeight,
		prevElem = this.g(this.o.prev),
		nextElem = this.g(this.o.next);
	
	if ( prevElem ) {
		this.elem[axes] == 0 ?
			prevElem.className = prevElem.className.replace(/\s*prevCurrent/g, "") :
			prevElem.className.indexOf("prevCurrent") < 0 ? 
			prevElem.className += " prevCurrent" :
			"";
	};
	
	if ( nextElem ) {
		this.elem[axes] == maxTopScope - boxDcope ?
			nextElem.className = nextElem.className.replace(/\s*nextCurrent/g, "") :
			nextElem.className.indexOf("nextCurrent") < 0 ?
			nextElem.className += " nextCurrent" :
			"";
	};
	
};

Scroll.prototype.stop = function(){
	this.isStop = 1;
	clearTimeout(this.timer);
};
Scroll.prototype.start = function(){
	var that = this,
		time = this.o.rest || this.speed || 1000;
	clearTimeout(this.timer);
	this.isStop = 0;
	this.timer = setTimeout(function(){ that.action() }, time);
};

/**
 * 设置上一个下一个节点
 */
Scroll.prototype.prevElem = function(){
	var that = this;
	this.prevElement.onclick = function() { return false };
	if ( this.prevElement && this.o.range && this.isStop == 0 ) {
		this.on(this.prevElement, "click", function(){
			if ( that.isStop == 1 ) { return false };
			that.action( -1 );
		});
	};
};

Scroll.prototype.nextElem = function(){
	var that = this;
	this.nextElement.onclick = function() { return false };
	if ( this.nextElement && this.o.range && this.isStop == 0 ) {
		this.on(this.nextElement, "click", function(){
			if ( that.isStop == 1 ) { return false };
			that.action( 1 );
		});
	};
};

/**
 * 提供上一个下一个接口
 */
Scroll.prototype.prev = function() {
	this.action( -1 );
};
Scroll.prototype.next = function() {
	this.action( 1 );
};

Scroll.prototype.g = function(elem){ return typeof(elem)=="object" ? elem : document.getElementById(elem) };

Scroll.prototype.on = function( elem, type, listener ){
    type = type.replace(/^on/i, '').toLowerCase();
    var realListener = listener;
    if( elem.addEventListener ) {
        elem.addEventListener(type, realListener, false);
    } else if ( elem.attachEvent ) {
        elem.attachEvent('on' + type, realListener);
    };
    return elem;
};

// 辅助方法
Scroll.prototype.getStyle = function( elem, name ){// 获取CSS属性函数
	if(elem.style[name]!='')return elem.style[name];
	if(!!window.ActiveXObject)return elem.currentStyle[name];
	return document.defaultView.getComputedStyle(elem,"").getPropertyValue(name.replace(/([A-Z])/g,"-$1").toLowerCase());
};

// 滚动变速相关
Scroll.prototype.cpu = function( t, b, c, d ){ return c*((t=t/d-1)*t*t+1)+b; };

Scroll.prototype.slowdown = function( finish, _f ){
	
	if ( this.o.slider !== undefined ){
		var max = this.elem.scrollWidth,
			range = this.o.range;
		if ( this.axes == "scrollTop" ) {
			max = this.elem.scrollHeight;
		};
		if ( finish > max - range ) {
			finish = 0;
		};

		if ( finish < 0 ) {
			finish = max - range;
		};
	};

	var count = 0,
		elem = this.elem,
		plan = this.axes,
		start = elem[plan],
		// finish = finish % this.o.range == 0 ? finish : finish % this.o.range + finish,// 修正滚动的距离
		space = finish - start,
		speed = this.speed,
		that = this,
		command;
	
	function place(){
		if ( !that.o.animation ) {// 无动画时直接设置参数并跳出
			elem[plan] = finish;
			if(_f)_f();
			return false;
		};

		elem[plan] = that.cpu(count,start,space,speed);// 通过CPU()函数计算出当前应该出现的位置
		count++;
		if(count === speed){// 当变量与速度相等时表示达到终点
			clearTimeout(command);
			count = 0;
			elem[plan] = finish;// 精确终点位置
			if(_f)_f();
			return false;
		};
		command = setTimeout(place,15);
	};
	
	place();
};


