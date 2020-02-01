(define script (element-new '(script "import '@material/mwc-button';")))
(element-write-attribute! script "type" "module")
(define head (getelem "head"))
(element-append-child! head script)
