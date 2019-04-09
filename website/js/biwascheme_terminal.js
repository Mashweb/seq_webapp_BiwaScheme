function unbalanced_parentheses(text_code) {
    var tokens = (new BiwaScheme.Parser(text_code)).tokens;
    var parentheses = 0;
    var brakets = 0;
    for(var i=0; i<tokens.length; ++i) {
        switch(tokens[i]) {
            case "[": ++brakets; break;
            case "]": --brakets; break;
            case "(": ++parentheses; break;
            case ")": --parentheses; break;
        }
    }
    return parentheses != 0 || brakets != 0;
}
// tokenizer from Lips interpreter
//--------------------------------------------------------------------------
var tokenize = (function() {
    var pre_parse_re = /("(?:\\[\S\s]|[^"])*"|\/(?! )[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|\(|\)|$)|;.*)/g;
    var tokens_re = /("(?:\\[\S\s]|[^"])*"|\/(?! )[^\/\\]*(?:\\[\S\s][^\/\\]*)*\/[gimy]*(?=\s|\(|\)|$)|\(|\)|'|"(?:\\[\S\s]|[^"])+|(?:\\[\S\s]|[^"])*"|;.*|(?:[-+]?(?:(?:\.[0-9]+|[0-9]+\.[0-9]+)(?:[eE][-+]?[0-9]+)?)|[0-9]+\.)[0-9]|\.|,@|,|`|[^(\s)]+)/gim;
    /* eslint-enable */
    // ----------------------------------------------------------------------
    return function tokens(str) {
        var count = 0;
        var offset = 0;
        var tokens = [];
        str.split(pre_parse_re).filter(Boolean).forEach(function(string) {
            if (string.match(pre_parse_re)) {
                if (!string.match(/^;/)) {
                    var col = (string.split(/\n/), [""]).pop().length;
                    tokens.push({
                        token: string,
                        col,
                        offset: count + offset,
                        line: offset
                    });
                    count += string.length;
                }
                offset += (string.match("\n") || []).length;
                return;
            }
            string.split('\n').filter(Boolean).forEach(function(line, i) {
                var col = 0;
                line.split(tokens_re).filter(Boolean).forEach(function(token) {
                    var line = i + offset;
                    var result = {
                        col,
                        line,
                        token,
                        offset: count + line
                    };
                    col += token.length;
                    count += token.length;
                    tokens.push(result);
                });
            });
        });
        return tokens;
    };
})();
//--------------------------------------------------------------------------
function sexp(tokens) {
   var count = 1;
   var i = tokens.length;
   while (count > 0) {
       var token = tokens[--i];
       if (!token) {
           return;
       }
       if (token.token === '(') {
           count--;
       } else if (token.token == ')') {
           count++;
       }
   }
   return tokens.slice(i);
}
//--------------------------------------------------------------------------
function indent(code, level, offset) {
   var tokens = tokenize(code, true);
   var last_sexpr = sexp(tokens);
   var lines = code.split('\n');
   var prev_line = lines[lines.length - 1];
   var parse = prev_line.match(/^(\s*)/);
   var spaces = parse[1].length || offset;
   if (last_sexpr) {
       if (last_sexpr[0].line > 0) {
           offset = 0;
       }
       if (last_sexpr.length === 1) {
           return offset + last_sexpr[0].col + 1;
       } else if (['define', 'lambda', 'let'].indexOf(last_sexpr[1].token) !== -1) {
           return offset + last_sexpr[0].col + level;
       } else if (last_sexpr[0].line < last_sexpr[1].line) {
           return offset + last_sexpr[0].col + 1;
       } else if (last_sexpr.length > 3 && last_sexpr[1].line === last_sexpr[3].line) {
           if (last_sexpr[1].token === '(') {
               return offset + last_sexpr[1].col;
           }
           return offset + last_sexpr[3].col;
       } else if (last_sexpr[0].line === last_sexpr[1].line) {
           return offset + last_sexpr[1].col;
       } else {
           var next_tokens = last_sexpr.slice(2);
           for (var i in next_tokens) {
               var token = next_tokens[i];
               if (token.token.trim()) {
                   return token.col;
               }
           }
       }
   }
   return spaces + level;
}
//--------------------------------------------------------------------------
jQuery(document).ready(function($, undefined) {
    $.terminal.syntax("scheme");
    var prompt = 'biwascheme> ';
    //NOTE: $ is jQuery in this scope
    var trace = false;
    var bscheme = new BiwaScheme.Interpreter(function(e, state) {
       term.error(e.message);
    });

    Console.puts = function(string) {
        term.echo(string);
    };
    BiwaScheme.Port.current_output = new BiwaScheme.Port.CustomOutput(
        Console.puts
    );
    BiwaScheme.Port.current_input = new BiwaScheme.Port.CustomInput(function(callback){
        term.read('read> ', callback);
    });
    var position;
    var timer;
    var term = $('#term').terminal(function(code, term) {
        try {
            if (trace) {
                var opc = biwascheme.compile(code);
                var dump_opc = (new BiwaScheme.Dumper()).dump_opc(opc);
                term.echo(dump_opc, {raw: true});
            }
            var result = bscheme.evaluate(code, function(result) {
                if (result !== undefined && result !== BiwaScheme.undef) {
                    term.echo('=> ' + BiwaScheme.to_write(result));
                }
            });
        } catch(e) {
            term.error(e.message);
            throw(e);
        }
    }, {
        keymap: {
            ENTER: function(e, original) {
                if (unbalanced_parentheses(this.get_command())) {
                    var i = indent(term.before_cursor(), 2, prompt.length);
                    this.insert('\n' + (new Array(i + 1).join(' ')));
                } else {
                    original();
                }
            }
        },
        onPaste: function(e) {
            if (e.text) {
                var code = e.text;
                var lines = code.split('\n').map(function(line) {
                    return line.trim();
                });
                var output = '';
                var prompt = this.get_prompt();
                for (var i = 1; i < lines.length; ++i) {
                    var c = lines.slice(0, i).join('\n');
                    var ind = indent(c, 2, prompt.length);
                    var spaces = new Array(ind + 1).join(' ');
                    lines[i] = spaces + lines[i];
                }
                return lines.join('\n');
            }
        },
        keydown: function() {
            if (position) {
                term.set_position(position);
                position = false;
            }
        },
        keypress: function(e) {
            var term = this;
            if (e.key == ')') {
                setTimeout(function() {
                    position = term.get_position();
                    var command = term.get_command().substring(0, position);
                    var len = command.split(/\n/)[0].length;
                    var tokens = tokenize(command);
                    var count = 1;
                    var token;
                    var i = tokens.length - 1;
                    while (count > 0) {
                        token = tokens[--i];
                        if (!token) {
                            return;
                        }
                        if (token.token === '(') {
                            count--;
                        } else if (token.token == ')') {
                            count++;
                        }
                    }
                    if (token.token == '(' && count === 0) {
                        clearTimeout(timer);
                        setTimeout(function() {
                            var offset = token.offset;
                            term.set_position(offset);
                            timer = setTimeout(function() {
                                term.set_position(position);
                                position = false;
                            }, 200);
                        }, 0);
                    }
                }, 0);
            } else {
                position = false;
            }
        },
        greetings: false,
        width: 500,
        height: 250,
        name: 'biwa',
        exit: false,
        prompt: prompt
    });
    // we don't want formatting on version number
    term.echo('BiwaScheme Interpreter version ' + BiwaScheme.Version, {
        formatters: false
    });
    // run trace mode
    BiwaScheme.define_libfunc("trace", 0, 0, function(args) {
        trace = !trace;
        return BiwaScheme.undef;
    });
    // redefine sleep it sould pause terminal
    BiwaScheme.define_libfunc("sleep", 1, 1, function(ar){
        var sec = ar[0];
        BiwaScheme.assert_real(sec);
        term.pause();
        return new BiwaScheme.Pause(function(pause){
            setTimeout(function(){
                term.resume();
                pause.resume(BiwaScheme.nil);
            }, sec * 1000);
        });
    });
    /*
    // load should pause terminal
    BiwaScheme.define_libfunc("load", 1, 1, function(ar, intp){
        var path = ar[0];
        assert_string(path);
        term.pause();
        return new BiwaScheme.Pause(function(pause){
            $.ajax({
                url: path,
                processData: false,
                success: function(data) {
                    term.resume();
                    term.echo(data);
                    term.echo(pause instanceof BiwaScheme.Pause);
                    try {
                        // throw too much recursion here
                        bscheme.evaluate(data, function() {
                            return pause.resume(BiwaScheme.undef);
                        });
                        term.echo(path + ' loaded');
                    } catch(e) {
                        term.error(e.message);
                        throw(e);
                    }
                },
                error: function(xhr, stat) {
                    term.error("[AJAX] " + stat + " server reponse: \n" +
                               xhr.reponseText);
                }});
        });
    });
    */
    // clear terminal
    BiwaScheme.define_libfunc('clear', 0, 0, function(args) {
        term.clear();
        return BiwaScheme.undef;
    });

    // return all procedures from global environment
    BiwaScheme.define_libfunc('env', 0, 0, function(args) {
        var result = new Array();
        for(fun in window.BiwaScheme.CoreEnv) {
            result[result.length] = fun;
        }
        return BiwaScheme.array_to_list(result);
    });

    // return list of object properties like dir from python
    BiwaScheme.define_libfunc('dir', 1, 1, function(args) {
        var result = [];
        var object = args[0];
        for (i in object) {
            result.push(i);
        }
        return BiwaScheme.array_to_list(result);
    });

    // check if object is in list
    BiwaScheme.define_libfunc('contains?', 2, 2, function(args) {
        assert_list(args[1]);
        return $.inArray(args[0], args[1].to_array()) != -1;
    });

    // concatenate two or more string
    BiwaScheme.define_libfunc("concat", 1, null, function(args) {
        for (var i=args.length; i--;) {
            assert_string(args[i]);
        }
        return args.length == 1 ? args[0] : args.join('');
    });

    BiwaScheme.define_libfunc("join", 2, 2, function(args) {
        assert_list(args[1]);
        assert_string(args[0]);
        var array = args[1].to_array();
        for (var i=array.length; i--;) {
            assert_string(array[i]);
        }
        return array.join(args[0]);
    });

    BiwaScheme.define_libfunc("split", 2, 2, function(args) {
        assert_string(args[0]);
        assert_string(args[1]);
        var result = args[1].split(args[0]);
        return result.to_list();
    });

});
