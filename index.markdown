---
layout: biwascheme
title: Sequential Programming
---

<h1>Sequentially Programmed Web App Demo</h1>

This brief introduction to sequentially programmed web apps
includes a live demonstration of such an app
to show how the programming is done.
Basically "sequentially programmed" means the program's structure mirrors
its execution flow.
The introduction then goes on to explain the motivation for writing
programs in this manner.

<h2>Try It Now</h2>

Enter the following code in the biwascheme console below.
(Always terminate code in the console with a RETURN.)

{% highlight lisp %}

(load "mini-framework.scm")
(define (test)
  (with-handlers ((click-handler "#div1")
                  (click-handler "#div2")
                  (keydown-handler "#button1")
                  (keydown-handler "#button2")
                  (timeout-handler test-timeout 10000))
                 (display (get-input))
                 (display (get-input))
                 (display (get-input))
                 (display (get-input))
                 (display (get-input)))
  (display "Test finished."))
{% endhighlight %}

The code defines a Scheme function named ```test```.
Now whenever you enter ```(reset (test))``` into the console the test will run.
```with-handlers``` sets up two click handlers, two keydown handlers,
and a timeout handler.
Until one of those events occurs, the program will not proceed through
the first ```get-input```.
When any of the events occurs ```get-input``` will return
the event's data, ```display``` will print the type of event,
and the program will pause until one of the handlers is triggered again,
and so forth, until all four calls to ```get-input``` have returned.
Then the program prints "Test finished."

<div>
  <button id="button1" style="height:60px; width:100px;">Button #1</button>
  <button id="button2" style="height:60px; width:100px;">Button #2</button>
  <div id="div1" style="height:100px; width:100px; background-color:yellow;"
       display="inline">
    Div #1
  </div>
  <div id="div2" style="height:100px; width:100px; background-color:green;"
       display="inline">
    Div #2
  </div>
</div>
<div id="term"></div>
<script type="text/javascript">$("a").get(1).click();</script>
    
## What Is Sequential Programming?

Sequential programming of a web application is radically different
from the dominant style of web-application programming, but it should
be remembered that the dominant style of programming for many (probably most)
*offline* applications is sequential. The sequential style of programming is
suitable for a wide range of applications and application programmers
because it models a program after the stepwise logic used to complete a
program's goal. The sequential style of programming is the easiest style to
master, all things being equal, because it straightforwardly mirrors our
thinking about what the program must do to fulfil its purpose.
It is interesting to explore the possibility of writing web applications
in a sequential style because the dominant, non-sequential styles
make it difficult to follow execution flow through the program's code.
The difficulty complicates program development, testing, and refactoring.
The discussion thread
["Node.js - A giant step backwards?"](https://news.ycombinator.com/item?id=3510758)
presents some of the problems of a relatively new style of web-application
programming, namely event-driven programming for the web server,
that has become popular in the last few years.

This introduction briefly explains how a traditional web application and a
web application written in the newer event-driven style (<em>ala</em> Node.js)
handle asynchronous events.
Then it points out a working example of an application written for a
continuation-based web server and online resources for learning important
ideas about such applications. Finally it presents a continuation-based
web application that runs entirely in the web browser--a single-page
web application.

<h2>How Asynchronous Events Are Handled in Web Applications</h2>

Any program, simple or complex, that uses I/O (user I/O, disk reads,
disk writes, or transfers of data between computers) must have a means of
synchronizing itself with the completion of that I/O. For desktop applications,
the operating system provides system calls, a scheduler, and library functions
that allow the programmer to structure for his program to mirror
the program's execution flow. For desktop applications, the waiting
for completion of I/O can usually be neatly hidden within some function
like read(), write(), getchar(), etc., but in most web applications written
up to 2020, this mirroring is not possible, due to the stateless nature of
the web. Not even a web application written to run entirely in the
web browser (a single-page web application) can mirror program flow,
due to the event-driven nature of JavaScript in the web browser.

In 2020, web servers can be classified as event-driven (like Node.js) and
non-event-driven (traditional web servers). An event-driven web server
can react to many asynchronous events in real time, without holding up
the main event loop.

Web applications written for an event-driven web server and typical
single-page web applications are structured using callbacks, deferreds,
promises, or some form of continuation-passing style. Thus, their struction
cannot mirror their flow. However, a web application written using <em>true</em>
continuations <em>can</em> be structured to mirror its flow.

## Traditional Web Applications vs. Web Applications Built upon Server-Side Web Continuations

Very often, web applications interact with the user by building request
pages that pass program state information from web page to web page in
cookies or hidden form fields, something like this Racket Scheme code:

{% highlight lisp %}

(define (sum query)
  (build-request-page "First number:" "/one" ""))

(define (one query)
  (build-request-page "Second number"
                      "/two"
                      (cdr (assq 'number query))))

(define (two query)
  (let ([n (string->number (cdr (assq 'hidden query)))]
	[m (string->number (cdr (assq 'number query)))])
    `(html (body "The sum is " ,(number->string (+ m n))))))

(hash-set! dispatch-table "sum" sum)
(hash-set! dispatch-table "one" one)
(hash-set! dispatch-table "two" two)

{% endhighlight %}

That is the typical, traditional programming style of writing a web application.
Such a style is more complicated and unwieldy than a straightforward style
employing server-side web continuations:

{% highlight lisp %}

(define (sum2 query)
  (define m (get-number "First number:"))
			(define n (get-number "Second number:"))
			`(html (body "The sum is " ,(number->string (+ m n)))))

{% endhighlight %}

Both the web server code and both versions of the application code are
fully described in the section
[Continuations](https://docs.racket-lang.org/more/#%28part._.Continuations%29")
of the page
[More: Systems Programming with Racket](https://docs.racket-lang.org/more/#%28part._.Continuations%29")

The reader is strongly encouraged to
[download Racket](https://download.racket-lang.org/),
load the
[the finished Racket Scheme code](https://docs.racket-lang.org/more/step9.txt)
and run the code—a five- to ten-minute exercise.
The code can be loaded and run in Racket something like this (where 8080 is
the port number to which the server responds and &quot;step9.txt&quot; is the full or
relative pathname of the Racket Scheme code):

{% highlight shell %}

$ racket
Welcome to Racket v7.5.
> (enter! "step9.txt")
"step9.txt"> (serve 8080)
#<procedure:...webcon/step9.txt:17:2>
"step9.txt">

{% endhighlight %}

(```$``` and ```>``` are prompts.)
After starting the program, you can use the web application locally
by typing <a href="http://localhost:8080/sum2">http://localhost:8080/sum2</a>
into your web browser's address bar.
The program asks for and waits for one number, then jumps to a second web page,
where it asks for and waits for a second number, then jumps to a third web page,
where it sums the two
numbers. Along the way it stores continuations to remember its each halt
after serving a page, even saving the first and second numbers.
In case the user presses his browser's back button once or twice anywhere
along the way, or retypes the URL of the second or first page, the program
recalls its state when a number was typed into the respective page,
and shows the number and again in its input form,
just as the user originally typed it, and the user can change the number
or accept it and continue the program as before.

Section 5.2 of Christian Queinnec's paper
<a href="https://pages.lip6.fr/Christian.Queinnec/PDF/www.pdf">'Inverting back the inversion of control or, Continuations versus page-centric programming'</a>
describes a very similar web application but does not detail its implementation.

## Client-Side Web Continuations

Server-side web continuations are interesting because they simplify
the creation of web applications. However, the amount of memory they consume
easily becomes a problem. 
To overcome this problem,
it would be convenient to put the continuations in the browser,
This way, the memory burden of 10,000 or 1,000,000
simultaneous users is not placed on the web server,
but instead spread across all the web browsers visiting the website.
This brief introduction to sequentially programmed web apps
demonstrates a way to create a web application using
client-side (in-the-browser) continuations.
The demo incorporates
[BiwaScheme](https://github.com/biwascheme/biwascheme),
a Scheme language implementation in JavaScript.
See [Further Reading](reading.html).

The core of the test program is just this:

{% highlight lisp %}
(with-handlers ((click-handler "#div1")
                (click-handler "#div2")
                (keydown-handler "#button1")
                (keydown-handler "#button2")
                (timeout-handler test-timeout 20000))
               (display (get-input))
               (display (get-input))
               (display (get-input))
               (display (get-input))
               (display (get-input)))
{% endhighlight %}

The macro ```with-handlers``` sets up any number of
event handlers (```click```, ```mousedown```, ```mouseup```, ```mouseover```,
```keydown```, ```keyup```, ```timout```, etc.) and removes them
when execution exits its block.
The function <code>get-input</code> sets up a continuation that returns
execution to that point only after an event has occurred.
The invocation of ```with-handlers``` in our test program
sets up five event handlers:

1. A handler triggered by a click on the ```div``` element having the ID
```div1```,

1. a handler triggered by a click on the ```div``` element having the ID
```div2```,

1. a handler triggered by a keypress when the keyboard input focus is on the
```button``` element having the ID ```button1```,

1. a handler triggered by a keypress when the keyboard input focus is on the
```button``` element having the ID ```button2```,

1. a handler triggered after 20 seconds if no other event is triggered first.

To set the focus on an element such as a button, you can click on that element.
