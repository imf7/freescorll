/*
  auther:f7
  date:2012.05
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
 * @config {Number}  [index]  初始化到滚动过多少像素
 * @config {Number}  [rest]  中间休息时间，该参数决定是否为间歇运动
 * @config {Number}  [range]  移动距离
 * @config {ElementHTML || ID}  [prev]  上一个按钮节点或者ID
 * @config {ElementHTML || ID}  [next]  下一个按钮节点或者ID
 * @config {Function}  [initCallback]  初始化完成HTML时执行的回调
 * @config {Function}  [callback]  间歇运动时，运动完成一个单元的回调函数
 */

function Scroll( elem, o ){
	if ( !(this instanceof Scroll) ) {
		return new Scroll( elem, o );
	}
	if ( !this.g(elem) ) { return false };
	this.o = o || {};
	this.elem = this.g(elem);
	this.prevElement = this.o.prev ? this.g(this.o.prev) : "";
	this.nextElement = this.o.next ? this.g(this.o.next) : "";
	this.move = this.o.move || "w";
	this.speed = this.o.speed || 30;
	this.o.auto === undefined ? this.o.auto = true : this.o.auto;
	this.modWidth = 0;// 原本模块初始宽度
	this.isStop = 0;
	this.timer = "";
	
	this.init();
};

Scroll.prototype.init = function(){
	var that = this,
		mytime = "",
		scroll = this.scrollAxes(),
		index = parseInt(this.o.index || 0);
	
	if ( !this.initHTML() ) { return false };
	
	this.elem.onmouseover = function(){
		clearTimeout(mytime);
		that.stop();
	};
	this.elem.onmouseout = function(){
		mytime = setTimeout(function(){ that.start() }, 100);
	};
	
	this.prev();
	this.next();
	
	this.resetPrevNext();
	
	// 初始化滚动前的位置
	this.o.auto !== false ?
		this.elem[scroll] = this.modWidth > 0 ?
			this.modWidth + index :
			this.elem.scrollHeight/2 + index
		:
		this.elem[scroll] = index;
	
	if ( this.o.initCallback ) { this.o.initCallback() };
	
	setTimeout(function(){that.action();}, this.o.rest || this.speed || 1000);
	
	// 处理页签切换
	if ( window.addEventListener ) {
		window.addEventListener("focus", function(){ that.start() }, false);
		window.addEventListener("blur", function(){ that.stop() }, false);
	}/* else {// IE不存在切换页签停止setTimeout问题，所以不必暂停
		window.attachEvent("onfocus", function(){ that.start() });
		window.attachEvent("onblur", function(){ that.stop() });
	}*/
	
};

Scroll.prototype.initHTML = function(){
	var contentHTML = this.elem.innerHTML,
		allWidthElem,
		innerWidthElem;
	
	if ( this.scrollAxes() == "scrollTop" ) {// 纵向滚动
		if ( this.elem.scrollHeight <= parseInt(this.getStyle(this.elem, "height")) ) {// 检测是否符合效果基础条件
			return false;
		}
		if ( this.o.auto === true ) {// 需要滚动
			this.elem.innerHTML += this.elem.innerHTML;
		}
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
		
		if ( this.elem.scrollWidth <= parseInt(this.getStyle(this.elem, "width")) ) {// 检测是否符合效果基础条件
			return false;
		}
		
		if ( this.o.auto === true ) {// 需要滚动
			allWidthElem.innerHTML = contentHTML + contentHTML;
			allWidthElem.style.width = this.modWidth * 2 + "px";
		} else {
			allWidthElem.innerHTML = contentHTML;
			allWidthElem.style.width = this.modWidth + "px";
		}
	}
	
	return true;
};

Scroll.prototype.action = function(c){
	if ( this.isStop == 1 && !c ) { return false };
	var that = this,
		scroll = this.scrollAxes(),
		isES = this.o.auto !== false && (this.o.move == "e" || this.o.move == "E" || this.o.move == "s" || this.o.move == "S"),// true 代表反向运动
		range = isES ? -parseInt(this.o.range) : parseInt(this.o.range),
		n = isES ? -1 : 1;
		
	clearTimeout(this.timer);
	
	if ( c ) {// 上一个下一个
		this.isStop = 1;
		this.slowdown( this.elem[scroll] + parseInt(this.o.range) * c, function(){
			if ( that.o.callback ) that.o.callback();
			that.resetPrevNext();
			that.resetScroll();
			
			that.isStop = 0;
		} );
	} else if ( this.o.rest ) {// 间歇运动
		this.isStop = 1;
		this.slowdown( this.elem[scroll] + range, function(){
			if ( that.o.callback ) that.o.callback();
			that.resetPrevNext();
			that.resetScroll();
			
			that.isStop = 0;
		} );
	} else if ( !this.o.rest && this.o.auto != false )  {// 无缝运动
		this.elem[scroll] += n;
		that.resetScroll();
	}
	
	if ( this.o.auto != false ) {
		this.timer = this.o.rest ? setTimeout(function(){that.action()}, this.o.rest) : setTimeout(function(){that.action()}, this.speed);
	}
	
};

// 重置scroll距离
Scroll.prototype.resetScroll = function(){
	if ( this.o.auto == false ) { return false };
	
	var start = this.modWidth > 0 ? this.modWidth : this.elem.scrollHeight/2,
		scroll = this.scrollAxes(),
		showScope = this.modWidth > 0 ? this.elem.clientWidth : this.elem.clientHeight,
		scrollMax = this.modWidth > 0 ? this.modWidth * 2 - showScope : this.elem.scrollHeight - showScope;
	
	if ( this.elem[scroll] == 0) {
		this.elem[scroll] = start;
	}
	if ( this.elem[scroll] == scrollMax) {
		this.elem[scroll] = start - showScope;
	}
};

// 重置箭头样式
Scroll.prototype.resetPrevNext = function(){
	if ( this.o.auto !== false ) return false; 
	var axes = this.scrollAxes(),
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
	}
	
	if ( nextElem ) {
		this.elem[axes] == maxTopScope - boxDcope ?
			nextElem.className = nextElem.className.replace(/\s*nextCurrent/g, "") :
			nextElem.className.indexOf("nextCurrent") < 0 ?
			nextElem.className += " nextCurrent" :
			"";
	}
	
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

Scroll.prototype.prev = function(){
	var that = this;
	if ( this.prevElement && this.o.range && this.isStop == 0 ) {
		this.prevElement.onclick = function(){
			if ( that.isStop == 1 ) { return false };
			that.action( -1 );
		}
	}
};

Scroll.prototype.next = function(){
	var that = this;
	if ( this.nextElement && this.o.range && this.isStop == 0 ) {
		this.nextElement.onclick = function(){
			if ( that.isStop == 1 ) { return false };
			that.action( 1 );
		}
	}
};

Scroll.prototype.g = function(elem){ return typeof(elem)=="object" ? elem : document.getElementById(elem) };

// 获取滚动的坐标轴
Scroll.prototype.scrollAxes = function(){
	return this.o.move && ( this.o.move == "n" || this.o.move == "N" || this.o.move == "s" || this.o.move == "S" ) ? "scrollTop" : "scrollLeft";
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
	var count = 0,
		elem = this.elem,
		plan = this.scrollAxes(),
		start = elem[plan],
		finish = finish % this.o.range == 0 ? finish : finish % this.o.range + finish,// 修正滚动的距离
		space = finish - start,
		speed = this.speed,
		that = this,
		command;
		
	function place(){
		elem[plan] = that.cpu(count,start,space,speed);// 通过CPU()函数计算出当前应该出现的位置
		count++;
		if(count === speed){// 当变量与速度相等时表示达到终点
			clearTimeout(command);
			count = 0;
			elem[plan] = space + start;// 精确终点位置
			if(_f)_f();
			return false;
		}
		command = setTimeout(place,15);
	}
	
	place();
};


