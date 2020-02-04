;; Get the head and body of the HTML document.
(define head (getelem "head"))
(define body (getelem "body"))

;; Add support for web components to older browsers.
(define script
  (element-new '(script src "https://unpkg.com/@webcomponents/webcomponentsjs/webcomponents-loader.js")))
(display "Created script to add web component support.")
(element-append-child! head script)
(display "Added support for web components to older browsers.")

;; Add extra fonts to the page.
(define roboto-font-link
  (element-new '(link href "https://fonts.googleapis.com/css?family=Roboto:300,400,500"
		      rel "stylesheet")))
(element-append-child! head roboto-font-link)
(display "Added Roboto fonts.")
(define material-icons-font-link
  (element-new '(link href "https://fonts.googleapis.com/css?family=Material+Icons&display=block"
		      rel "stylesheet")))
(element-append-child! head material-icons-font-link)
(display "Added Material Icons.")

;; Add Material Web Components button.
(define script2
  (element-new
   '(script
     type "text/javascript"
     "import('https://unpkg.com/@material/mwc-button/mwc-button.js?module');"
     )))
(display "Defined mwc-module import script.")
(element-append-child! head script2)
(display "Imported mwc-button.")

;; Add a mwc-button to the page:
(define mwc-button (element-new '(mwc-button "Click me!" raised)))
(element-append-child! (getelem "#testarea") mwc-button)
(display "Added mwc-button to the web page.")
