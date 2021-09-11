app.modules.directory = new trascender({
	properties: {
		name: "directory", 
		label: "Directorios", 
		icon: "fa-folder"
	},
	showApp: function(){
		return true;
	},
	onload: function(){
		
	},
	start: function(){
		this.createFolder(document.getElementById("ul_directory"),"d0",{
			name: "/",
			file: "/api/file/",
			folder: "/api/folder/",
			path: "/"
		});
	},
	open: function(){
		$("#directory_modal_list").modal("show");
	},
	
	
	tr: new trascender({
		onload: function(){
			this.service = {};
			this.service.read = ["GET", ":path:id"];
			this.service.folder_collection = ["GET", ":path:id/collection"];
			this.service.file_collection = ["GET", ":path:id/collection"];
			this.service.delete = ["DELETE", ":path:id"];
			this.service.update = ["PUT", ":path:id"];
			this.createServices();
		}
	}),
	
	archive: null,
	textFiles: ["txt","html","css","js","json","csv","md","gitignore","bowerrc"],
	mediaFiles: ["jpg","gif","png","ico","mp3","mp4","pdf"],
	
	close: function(){
		$("#ul_directory .selected").removeClass("selected");
		this.archive = null;
	},
	
	clean: function(){
		$("#ul_directory .selected").removeClass("selected");
		this.archive = null;
		this.parent.refreshView();
	},
	
	delete: async function(){
		try{
			let label = $(this.archive).find("label");
			if(confirm("Confirme eliminación del archivo")){
				let p;
				let i;
				if(this.isFile){
					p = label.attr("data-api-file");
					i = btoa(this.fullname);
				}else if(this.isFolder){
					p = label.attr("data-api-folder");
					i = (btoa(this.fullname.substr(1)));
				}
				
				await this.tr.service_delete({id: i, path: p});
				alert("Archivo eliminado correctamente");
				$(this.archive.parentNode).find("checkbox").click();
				location.reload();
			}
		}catch(e){
			console.log(e);
			alert(e);
		}
	},
	
	update: async function(){
		try{
			let label = $(this.archive).find("label");
			if(confirm("Confirme actualización del archivo")){
				let p;
				let i;
				if(this.isFile){
					p = label.attr("data-api-file");
					i = btoa(this.fullname);
				}
				
				await this.tr.service_update({id: i, path: p},JSON.stringify({content: this.fileContent}));
				alert("Archivo actualizado correctamente");
				$(this.archive.parentNode).find("checkbox").click();
				location.reload();
			}
		}catch(e){
			console.log(e);
			alert(e);
		}
	},
	
	select: async function(li){
		try{
			let label = $(li).find("label");
			label.addClass("selected");
			this.archive = li;
			
			this.isFile = (label.attr("data-type")=="file")?true:false;
			this.isFolder = (label.attr("data-type")=="folder")?true:false;
			
			if(this.isFile){
				this.name = label.text();
				this.fullname = label.attr("data-api-path");
				this.fullname = decodeURIComponent(this.fullname);
				this.type = this.name.split(".");
				this.type = this.type[this.type.length-1];
				this.isTextFile = this.textFiles.indexOf(this.type)>-1;
				this.isMediaFile = this.mediaFiles.indexOf(this.type)>-1;
				this.fullnameDOWNLOAD = (label.attr("data-api-file") + btoa(this.fullname) + "/download");
				this.fullnameGET = (label.attr("data-api-file") + btoa(this.fullname) + "/getfile");
				if(this.isTextFile){
					$(".loader").fadeIn();
					this.fileContent = await this.tr.service_read({id: btoa(this.fullname), path: label.attr("data-api-file")});
					$(".loader").fadeOut();
				}else if(this.isMediaFile){
					let child = null;
					switch(this.type){
						case "jpg":
							child = document.createElement("img");
							child.setAttribute("src", this.fullnameGET);
							break;
						case "png":
							child = document.createElement("img");
							child.setAttribute("src", this.fullnameGET);
							break;
						case "gif":
							child = document.createElement("img");
							child.setAttribute("src", this.fullnameGET);
							break;
						case "ico":
							child = document.createElement("img");
							child.setAttribute("src", this.fullnameGET);
							break;
						case "mp3":
							child = document.createElement("audio");
							child.setAttribute("controls","");
							child.setAttribute("src", this.fullnameGET);
							break;
						case "mp4":
							child = document.createElement("video");
							child.setAttribute("controls","");
							child.setAttribute("src", this.fullnameGET);
							break;
						case "pdf":
							child = document.createElement("object");
							child.setAttribute("data",this.fullnameGET);
							child.setAttribute("type", "application/pdf");
							break;
					}
					$(".dv-visualcontent").html(child);
				}
			}else{
				this.name = label.text();
				this.fullname = label.attr("data-api-path");
				this.fullname = decodeURIComponent(this.fullname);
				
				let n = label.attr("data-api-path");
				n = label.attr("data-api-file") + btoa(n) + "/uploader";
				
				$("#fileupload").attr("action",n);
			}
		}catch(e){
			console.log(e);
		}
		this.parent.refreshView();
	},
	
	createFolder: function(ulParent,id,directory){
		const li = document.createElement("li");
		const input = document.createElement("input");
		input.type = "checkbox";
		input.id = id;
		input.onchange = async (element)=>{
			this.clean();
			if(element.srcElement.checked){
				this.select(element.srcElement.parentNode);
				const labelParent = $(element.srcElement.parentNode).find("label");
				let coll;
				const newid = btoa(encodeURIComponent(labelParent.attr("data-api-path")));
				
				coll = await this.tr.service_folder_collection({id: newid, path: labelParent.attr("data-api-folder")});
				for(let i=0;i<coll.length;i++){
					this.createFolder(element.srcElement.parentNode.lastChild,element.srcElement.getAttribute("id") + "d" + i,{
						file: directory.file,
						folder:directory.folder,
						path: labelParent.attr("data-api-path") + coll[i] + "/",
						name: coll[i]
					});
				}
				
				coll = await this.tr.service_file_collection({id: newid, path: labelParent.attr("data-api-file")});
				for(let i=0;i<coll.length;i++){
					const label = document.createElement("label");
		
					label.setAttribute("data-api-file",labelParent.attr("data-api-file"));
					label.setAttribute("data-api-folder",labelParent.attr("data-api-folder"));
					label.setAttribute("data-api-path",labelParent.attr("data-api-path") + coll[i]);
					label.setAttribute("data-type","file");
		
					label.innerHTML = coll[i];
					
					const li = document.createElement("li");
					li.appendChild(label);
					li.onclick = (element) => {
						this.clean();
						this.select(element.srcElement.parentNode);
					}
					element.srcElement.parentNode.lastChild.appendChild(li);
				}
			}else{
				element.srcElement.parentNode.lastChild.innerHTML="";
			}
		};
		li.appendChild(input);

		const label = document.createElement("label");
		label.setAttribute("for", id);
		label.setAttribute("class", "folder");
		
		label.setAttribute("data-api-file",directory.file);
		label.setAttribute("data-api-folder",directory.folder);
		label.setAttribute("data-api-path", directory.path);
		label.setAttribute("data-type","folder");
		
		label.innerHTML = directory.name;
		li.appendChild(label);

		const ul = document.createElement("ul");
		ul.setAttribute("class","inside");
		li.appendChild(ul);
		
		ulParent.appendChild(li);
	},
	
	canAdmin: function(){
		return this.hasRole('root');
	}
	
	

	
});