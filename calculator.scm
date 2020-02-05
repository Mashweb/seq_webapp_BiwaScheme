;; Function for adding an mwc-button to the page.
(define (add-calculator-button label)
  (element-append-child! (getelem "#testarea2") (make-mwc-button label)))

(define i 0)
(repeat 10
	(begin
	  (add-calculator-button i)
	  (define i (+ i 1))))

(add-calculator-button "+")
(add-calculator-button "=")
