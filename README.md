# aiogram3.x-bot-template
template for aiogram3.x bots

# commands
you need to install dependencies with
~~~
uv sync
~~~
activate .venv
~~~
source .venv/bin/activate
~~~ or if you have the windows ~~~
source .venv/Scripts/activate
~~~
then to run your script:
~~~
python main.py
~~~
there we go

# command to generate requirements.txt from poetry:
~~~
uv pip freeze > requirements.txt
~~~

# custom commands
to add new module in uv:
~~~
uv add 
~~~
and write module name after add
** you may add module with version
~~~
uv add module@version
~~~
** you may write module names with space, for example:
```
uv add aiogram sqlalchemy fastapi
```

to delete module in poetry:
~~~
uv remove
~~~
and write module name after remove
