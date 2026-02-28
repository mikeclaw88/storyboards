
function LoadResources(list) {
    return new Promise( (fulfill, reject) => {
        var loadPromises = list.map( (path) => { 
            return fetch(path, { method: "GET", credentials: "include" })
                        .then( response => {
                            if (path.toLowerCase().endsWith(".yaml")) {
                                return response.text().then( text => {
                                    var yamlobj = jsyaml.load(text)
                                    return new Promise( (fulfill, reject) => {
                                        fulfill({ filename: path, data: yamlobj })
                                    }, () => {reject()})
                                })
                            } else if (path.toLowerCase().endsWith(".json")) {
                                return response.json().then( json => {
                                    return new Promise( (fulfill, reject) => {
                                        fulfill({ filename: path, data: json })
                                    }, () => {reject()})
                                })
                            } else if (path.toLowerCase().endsWith(".png") || path.toLowerCase().endsWith(".gif")) {
                                return response.blob().then( blob => {
                                    return new Promise( (fulfill, reject) => {
                                        let objurl = window.URL.createObjectURL(blob);
                                        let img = new Image()
                                        img.onload = () => {
                                            fulfill({ filename: path, data: img })
                                        }
                                        img.src = objurl
                                    }, () => {reject()})
                                })
                            } else if (path.toLowerCase().endsWith(".mp4") || path.toLowerCase().endsWith(".webm")) {
                                return response.blob().then( blob => {
                                    return new Promise( (fulfill, reject) => {
                                        let objurl = window.URL.createObjectURL(blob);
                                        let video = document.createElement('video')
                                        video.muted = true
                                        video.playsInline = true
                                        video.preload = 'auto'
                                        video.oncanplaythrough = () => {
                                            fulfill({ filename: path, data: video })
                                        }
                                        video.src = objurl
                                    }, () => {reject()})
                                })
                            }
                        })
        })

        Promise.all(loadPromises).then( all_resources => {
            console.log(all_resources)

            var lookup = all_resources.reduce( (acc, resource) => { 
                var acc_copy = acc
                acc_copy[resource.filename] = resource.data
                return acc_copy }, {} )

            console.log(lookup)

            fulfill(lookup)
        }, () => {
            reject()
        })
    })
}
