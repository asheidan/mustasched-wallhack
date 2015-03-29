var ToolbarButton = React.createClass({
	render: function () {
		var iconUrl = "/static/img/icons/" + this.props.icon + ".png";
		return (<li><a href="#" className="ToolbarButton" onClick={this.props.action} title={this.props.text}><img src={iconUrl} /></a></li>);
	}
});

var SlideShow = React.createClass({
	getInitialState: function () {
		return {currentSlide: 0, visible: true};
	},
	next: function () {
		this.setState({currentSlide: this.state.currentSlide + 1});
		this.resetTimer();
	},
	resetTimer: function () {
		this.stop();
		this.state.timer = window.setTimeout(this.next, 5000);
	},
	stop: function () {
		if (this.state.timer) {
			window.clearTimeout(this.state.timer);
		}
	},
	hide: function () {
	},
	render: function () {
		var style = {
			display: this.state.visible ? "block" : "none"
		};
		var current = this.state.currentSlide;
		var slides = this.props.slides.slice(current, current + 1);
		var slide;
		if (slides.length > 0) {
			slide = (<Slide src={slides[0]} next={this.next}/>);
		}
		return (
			<div style={style} className="SlideShow">
				<ul className="ToolBar">
				<ToolbarButton text="Stop" action={this.stop} />
				<li><span>{current}</span>/<span>{this.props.slides.length}</span></li>
				</ul>
				{slide}
			</div>);
	}
});

var Slide = React.createClass({
	handleClick: function (event) {
		this.props.next();
	},
	render: function () {
		return (<img className="Slide" src={this.props.src.url} alt={this.props.src.name} onClick={this.handleClick} />)
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
		this.props.changedir(this.props.path);
	},
	render: function () {
		return (<a href="#" onClick={this.handleClick}>{this.props.name}</a>);
	}
});

var DirectoryBreadCrumbs = React.createClass({
	render: function () {
		var pathComponents = this.props.path.split('/').filter(function (s) { return s; });
		console.log(pathComponents);
		var currentPath = "";
		var links = pathComponents.map(function (component) {
			currentPath = [currentPath, component].join('/');
			var element = (<DirectoryComponent path={currentPath} name={component} changedir={this.props.changedir} />);
			return element;
		}.bind(this));
		return (<div className="DirectoryBreadCrumbs">{links}</div>);
	}
});

var FileBrowser = React.createClass({
	getInitialState: function () {
		return {url: this.props.url, root:".../", files:[], dirs:[], slides: []};
	},
	changeDirectory: function (path) {
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
		this.setState({url: url, filterText: ""});
		this.fetchDirectoryList(url);
	},
	slideShowCurrentDir: function (event) {
		this.setState({slides: this.state.files});
	},
	fetchDirectoryList: function (url) {
		$.ajax({
			url: "/list/" + url,
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
				<SlideShow slides={this.state.slides} />
				<ul className="ToolBar">
				<li><DirectoryBreadCrumbs path={this.state.root} changedir={this.changeDirectory} /></li>
				<ToolbarButton action={this.slideShowCurrentDir} icon="slideshow" text="Slideshow" />
				</ul>
				<FilterWidget filterText={this.state.filterText} onUserInput={this.handleUserInput} />
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
			dirs = this.props.dirs.filter(function (dir) { return dir.match(reg); });
		}
		else {
			dirs = this.props.dirs;
		}

		var rows = dirs.map(function (dir) {
			return (<DirectoryItem name={dir} changedir={this.props.changedir} />);
		}.bind(this));

		return (<tbody className="DirectoryList">{rows}</tbody>);
	}
});

var DirectoryItem = React.createClass({
	handleClick: function (event) {
		this.props.changedir(this.props.name);
	},
	render: function () {
		return (<tr className="DirectoryItem"><td>D</td><td><a href="#" onClick={this.handleClick}>{this.props.name}/</a></td></tr>);
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
	render: function () {
		var files = [];
		return (<tr><td>F</td><td><a href="">{this.props.file.name}</a></td></tr>);
	},
});

React.render(<FileBrowser url="/" />,
			 document.getElementById('content'));
