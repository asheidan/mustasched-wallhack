var types = {
	"file": {
		"name": "string",
		"url": "string"
	},
	"dir": {
		"name": "string",
		"url": "string"
	}
};

var ToolbarButton = React.createClass({
	handleClick: function (event) {
		event.preventDefault();
		this.props.action();
	},
	render: function () {
		var iconUrl = "/static/img/icons/" + this.props.icon + ".png";
		var style = {
			width: "16px",
			height: "16px"
		};
		return (
			<li>
				<a href="#" style={style} className="ToolbarButton" onClick={this.handleClick} title={this.props.text}>
					<img width="16" height="16" src={iconUrl} />
				</a>
			</li>
		);
	}
});

var SlideShow = React.createClass({
	getInitialState: function () {
		return {currentSlide: 0, files: [], dirs: []};
	},
	slideshowRecursive: function (url) {
		this.fetchDirectoryList(url);
	},
	fetchDirectoryList: function (url) {
		console.log(url);
		this.setState({url: url});
		$.ajax({
			url: url,
			dataType: 'json',
			success: function (data) {
				var dirs = this.state.dirs;
				data.dirs = dirs.concat(data.dirs);

				var files = data.files.filter(function (file) {
					return file.name.match(SlideShow.validImages);
				});
				data.files = files;

				this.setState(data);
				if (this.state.files.length === 0) {
					this.next();
					return;
				}
				this.setState({currentSlide: 0});
			}.bind(this),
			error: function (xhr, status, err) {
				console.error(url, status, err.toString());
			}.bind(this)
		});
	},
	prev: function () {
		var currentSlide = this.state.currentSlide;
		if (currentSlide > 0) {
			currentSlide -= 1;
		}
		else {
			currentSlide = this.state.files.length - 1;
		}
		this.setState({currentSlide: currentSlide});
		if (this.state.timer) {
			this.resetTimer();
		}
	},
	next: function () {
		var currentSlide = this.state.currentSlide + 1;
		if (currentSlide >= this.state.files.length) {
			currentSlide = 0;
			var dirs = this.state.dirs;
			var nextDir = dirs.shift();
			if (nextDir) {
				this.fetchDirectoryList(nextDir.url);
			}
			this.setState({currentSlide: currentSlide});
		}
		else {
			this.setState({currentSlide: currentSlide});
		}
		if (this.state.timer) {
			this.resetTimer();
		}
	},
	resetTimer: function () {
		this.stop();
		this.setState({timer: window.setTimeout(this.next, 5000)});
	},
	stop: function () {
		var timer = this.state.timer;
		if (timer) {
			window.clearTimeout(timer);
			this.setState({timer: undefined});
		}
	},
	hide: function () {
	},
	render: function () {
		var style = {
			display: this.state.files.length > 0 ? "block" : "none"
		};
		var playPauseIcon = this.state.timer ? 'stop' : 'play';
		var playPauseAction = this.state.timer ? this.stop : this.resetTimer;
		var current = this.state.currentSlide;
		var slides = this.state.files.slice(current, current + 1);
		var slide;
		if (slides.length > 0) {
			slide = (<Slide key="1" src={slides[0]} next={this.next} root={this.state.root} />);
		}
		return (
			<div style={style} className="SlideShow">
				<div className="SlideContainer">
					<ul className="ToolBar">
						<ToolbarButton text="Prev" icon="prev" action={this.prev} />
						<ToolbarButton text={playPauseIcon} icon={playPauseIcon} action={playPauseAction} />
						<ToolbarButton text="Next" icon="next" action={this.next} />
						<li><div><span>{current + 1}</span>/<span>{this.state.files.length}</span></div></li>
					</ul>
					{slide}
				</div>
			</div>);
	}
});
SlideShow.validImages = new RegExp("\.(?:jpe?g|gif|png)$", "i");

var InfoField = React.createClass({
	render: function () {
		return (
				<div className="InfoField"><span className="label">{this.props.name}</span><span>{this.props.value}</span></div>
		);
	}
});

var Slide = React.createClass({
	handleClick: function (event) {
		event.preventDefault();
		this.props.next();
	},
	render: function () {
		var extra = [];
		if (this.props.extra) {
			for (var name in this.props.extra) {
				var value = this.props.extra[name];
				extra.push(
						<InfoField name={name} value={value} />
				);
			}
		}
		return (
				<div className="Slide">
				<img src={this.props.src.url} alt={this.props.src.name} onClick={this.handleClick} />
				<div className="SlideInformation">
				<InfoField name="filename" value={this.props.src.name} />
				<InfoField name="root" value={this.props.root} />
				{extra}
				</div>
				</div>
		);
	}
});

var FilterWidget = React.createClass({
	handleChange: function () {
		this.props.onUserInput(
			this.refs.filterTextInput.getDOMNode().value
		);
	},
	render: function () {
		return (
			<form>
				<input type="text" ref="filterTextInput" value={this.props.filterText} onChange={this.handleChange} />
			</form>
		);
	}
});

var DirectoryComponent = React.createClass({
	handleClick: function (event) {
		event.preventDefault();
		this.props.changedir(this.props.dir);
	},
	render: function () {
		return (<a href={this.props.dir.url} className="DirectoryComponent" onClick={this.handleClick}>{this.props.dir.name}</a>);
	}
});

var DirectoryBreadCrumbs = React.createClass({
	render: function () {
		var pathComponents = this.props.path.split('/').filter(function (s) { return s; });
		var currentPath = "/list";
		var dir = {
			name: "...",
			url: "/list/"
		};
		var links = [(<DirectoryComponent dir={dir} changedir={this.props.changedir} />)];
		pathComponents.forEach(function (component) {
			currentPath = [currentPath, component].join('/');
			var dir = {
				name: component,
				url: currentPath,
			};
			var element = (<DirectoryComponent dir={dir} changedir={this.props.changedir} />);
			links.push(element);
		}.bind(this));
		return (<div className="DirectoryBreadCrumbs">{links}</div>);
	}
});

var FileBrowser = React.createClass({
	getInitialState: function () {
		return {url: this.props.url, root:".../", files:[], dirs:[], slideshow: undefined};
	},
	changeDirectory: function (dir) {
		/*
		var url;
		if (path.match(/^\//)) {
			url = path;
		}
		else {
			var separator = "/";
			if (this.state.url.match(/\/$/)) {
				separator = "";
			}
			url = this.state.url + separator + path;
		}
		*/
		this.setState({url: dir.url, filterText: ""});
		this.fetchDirectoryList(dir.url);
	},
	slideShowCurrentDir: function (event) {
		this.refs.slideshow.slideshowRecursive(this.state.url);
	},
	fetchDirectoryList: function (url) {
		$.ajax({
			url: url,
			dataType: 'json',
			success: function (data) {
				this.setState(data);
			}.bind(this),
			error: function (xhr, status, err) {
				console.error(url, status, err.toString());
			}.bind(this)
		});
	},
	componentDidMount: function () {
		this.fetchDirectoryList(this.state.url);
	},
	handleUserInput: function (filterText) {
		this.setState({filterText: filterText});
	},
	render: function () {
		return (<div className="FileBrowser">
				<SlideShow ref="slideshow" />
				<DirectoryBreadCrumbs path={this.state.root} changedir={this.changeDirectory} />
				<ul className="ToolBar">
				<ToolbarButton action={this.slideShowCurrentDir} icon="slideshow" text="Slideshow" />
				<li><FilterWidget filterText={this.state.filterText} onUserInput={this.handleUserInput} /></li>
				</ul>
				<table>
				<tr><th></th><th>Name</th></tr>
				<DirectoryList dirs={this.state.dirs} changedir={this.changeDirectory} filterText={this.state.filterText} />
				<FileList files={this.state.files} changedir={this.changeDirectory} filterText={this.state.filterText} />
				</table>
				</div>);
	}
});

var DirectoryList = React.createClass({
	render: function () {
		var dirs = [];
		if (this.props.filterText) {
			var reg = new RegExp(this.props.filterText, "i");
			dirs = this.props.dirs.filter(function (dir) { return dir.name.match(reg); });
		}
		else {
			dirs = this.props.dirs;
		}

		var rows = dirs.map(function (dir) {
			return (<DirectoryItem data={dir} changedir={this.props.changedir} />);
		}.bind(this));

		return (<tbody className="DirectoryList">{rows}</tbody>);
	}
});

var DirectoryItem = React.createClass({
	handleClick: function (event) {
		event.preventDefault();
		this.props.changedir(this.props.data);
	},
	render: function () {
		return (<tr className="DirectoryItem"><td>D</td><td><a href="#" onClick={this.handleClick}>{this.props.data.name}/</a></td></tr>);
	},
});

var FileList = React.createClass({
	render: function () {
		var files = [];
		if (this.props.filterText) {
			var reg = new RegExp(this.props.filterText, "i");
			files = this.props.files.filter(function (file) { return file.name.match(reg); });
		}
		else {
			files = this.props.files;
		}

		var rows = files.map(function (file) {
					return (<FileItem file={file} />);
		}.bind(this));
		return (<tbody className="FileList">
				{rows}
				</tbody>);
	}
});

var FileItem = React.createClass({
	handleClick: function (event) {
		event.preventDefault();
		window.open(this.props.file.url);
	},
	render: function () {
		var files = [];
		return (<tr><td>F</td><td><a href="#" onClick={this.handleClick}>{this.props.file.name}</a></td></tr>);
	},
});

React.render(<FileBrowser url="/list/" />,
			 document.getElementById('content'));
