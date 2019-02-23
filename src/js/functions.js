(async function load(){
    //root de la url de la API
    const moviesURL = `https://yts.am/api/v2/list_movies.json?genre=`
    const finder_API = `https://yts.am/api/v2/list_movies.json?limit=1&query_term=`

    //=== Selectores Varios ===//
    //=========================//
    // contenedor de películas por género
    const $actionContainer = document.getElementById(`action`)
    const $dramaContainer = document.getElementById(`drama`)
    const $animationContainer = document.getElementById(`animation`)

    // otros contenedores
    const $featuringContainer = document.getElementById(`featuring`)
    const $form = document.getElementById(`form`)
    const $home = document.getElementById(`home`)

    // otros elementos del DOM
    const $modal = document.getElementById(`modal`)
    const $overlay = document.getElementById(`overlay`)
    const $hideModal = document.getElementById(`hide-modal`)

    // elementos dentro del modal
    const $modalTitle = $modal.querySelector(`h1`)
    const $modalImg = $modal.querySelector(`img`)
    const $modalDescription = $modal.querySelector(`p`)
    //=========================//
    //=== Selectores Varios ===//


    //-- función para agregar atributos a la imagen generada en el listener del submit --//
    function addAttributes($element, attributes) {
        for(const attribute in attributes ){
            $element.setAttribute(attribute, attributes[attribute])
        }
    }

    //-- función generar template para resultados de búsqueda --//
    function featuringTemplate(peli) {
        return (
          `<div class="featuring">
            <div class="featuring-image">
              <img src="${peli.medium_cover_image}" width="70" height="100" alt="">
            </div>
            <div class="featuring-content">
              <p class="featuring-title">Pelicula encontrada</p>
              <p class="featuring-album">${peli.title}</p>
            </div>
          </div>`
        )
    }


    //-- listener form --//
    $form.addEventListener('submit', async (event) => {
        event.preventDefault()
        $home.classList.add('search-active')
        const $loader = document.createElement('img')
        addAttributes($loader, {
            src: 'src/images/loader.gif',
            height: 50,
            width: 50,
        })
        $featuringContainer.innerHTML = ''
        $featuringContainer.append($loader)
        const data = new FormData($form)
        try {
            const peliculaBuscada = await getMovies(`${finder_API}${data.get('name')}`)
            $featuringContainer.innerHTML = featuringTemplate(peliculaBuscada.data.movies[0])
        } catch(error) {
            alert(error.message)
            $loader.remove()
            $home.classList.remove('search-active')
        }
    });

    //-- función para hacer el request a la API --//
    async function getMovies(url) {
        const response = await fetch(url)
        const data = await response.json()
        if (data.data.movie_count > 0){
            return data
        }
        throw new Error('No se encontró ningun resultado');
    }

    // Función filtro de id
    function idFilter(list, id){
        return list.find( movie => movie.id === parseInt(id, 10))
    }
    // Función findMovie
    function findMovie(id, category){
        switch (category) {
            case 'action':{
               return idFilter(actionList, id)
            }
            case 'drama': {
               return idFilter(dramaList, id)
            }
            default: {
               return idFilter(animationList, id)
            }
        }
    }         

    //-- función para mostrar el modal con el click --//
    function showModal($element) {
        $overlay.classList.add('active')
        $modal.style.animation = "modalIn .8s forwards";
        const id = $element.dataset.id
        const category = $element.dataset.category
        const modalMovieData = findMovie(id, category)
        $modalTitle.innerText = modalMovieData.title
        $modalImg.src = modalMovieData.medium_cover_image
        $modalDescription.innerText = modalMovieData.description_full
    }

    //-- función convertir texto html estructurado a código HTML --//
    function createTemplate(HTMLString) {
        const html = document.implementation.createHTMLDocument();
        html.body.innerHTML = HTMLString;
        return html.body.children[0];
    }

    //-- función listener click mostrar modal --//
    function addEventClick($element){
        $element.addEventListener( 'click', () => { 
            showModal($element) 
        })
    }

    //-- función para ocultar el modal --//
    function hideModal() {
        $overlay.classList.remove('active')
        $modal.style.animation = "modalOut .8s forwards";
    }
    //-- función listener click ocultar modal --//
    $hideModal.addEventListener('click', hideModal)

    //-- función para generar el código HTML por cada película --//
    function videoTemplate(movie, category) {    
        return(
            `<div class="primaryPlaylistItem" data-id="${movie.id}" data-category="${category}" >
                <div class="primaryPlaylistItem-image">
                <img class="opacity" src="${movie.medium_cover_image}" >
                </div>
                <h4 class="primaryPlaylistItem-title">
                    ${movie.title}
                </h4>
            </div>`
        )
    }

    //-- función para imprimir código html por cada película --//
    function printMoviesByGenre(genre, $container, genreName){
        $container.children[0].remove()
        genre.forEach( movie => {
            const newMovie = videoTemplate(movie, genreName)
            const movieElement = createTemplate(newMovie)
            $container.append(movieElement)
            const image = movieElement.querySelector('img')
            image.addEventListener( 'load', event => {
                event.srcElement.classList.remove('opacity')
                event.srcElement.classList.add('fadeIn') 
            })
            addEventClick(movieElement)
        })
    }

    async function cacheExist(category){
        const listName = `${category}List`
        const cacheList = localStorage.getItem(listName)
        if(cacheList) {
            return JSON.parse(cacheList);
        }
        // listas de objetos-películas por género (action) traidos desde la API (request)
        const { data: { movies: data }} = await getMovies(`${moviesURL}${category}`)
        // guardo el objeto en localStorage
        localStorage.setItem(listName, JSON.stringify(data))

        return data
    }
    
    const actionList = await cacheExist(`action`)
    const actionMoviesPrinted = printMoviesByGenre(actionList, $actionContainer, 'action')

    const dramaList = await cacheExist(`drama`)    
    const dramaMoviesPrinted = printMoviesByGenre(dramaList, $dramaContainer, 'drama')

    const animationList = await cacheExist(`animation`)    
    const animationMoviesPrinted = printMoviesByGenre(animationList, $animationContainer, 'animation')
})()