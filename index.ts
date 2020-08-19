import { put, post, get, listen, root, path, Request, Response, customMethod } from "summer-framework";
import "object-extention";

type Event = CreateEvent | DeleteEvent | UpdateEvent;

interface RawEvent {
  id: number;
}

interface CreateEvent extends RawEvent {
  type: "create";
  data: {
    description: string;
    done: boolean;
  };
}

interface DeleteEvent extends RawEvent {
  type: "delete";
}

interface UpdateEvent extends RawEvent {
  type: "update";
  data: {
    description?: string;
    done?: boolean;
  }
}

let id = 13;
const EVENT_LIST: Event[] = [
  {
    type: "create",
    id: 12,
    data: {
      description: "やる",
      done: true,
    }
  },
  {
    type: "delete",
    id: 12,
  },
  {
    type: "create",
    id: 13,
    data: {
      description: "foo",
      done: false,
    },
  },
  {
    type: "update",
    id: 13,
    data: {
      description: "bar",
    },
  },
  {
    type: "update",
    id: 13,
    data: {
      description: "bar?",
      done: true
    },
  },
];

interface Todo {
  id: number;
  description: string;
  done: boolean;
}

function deleteNullish(obj: any): object {
  return Object.entries(obj).filter(([_, value]) => value != null).reduce((p, [k, v]) => ({ ...p, [k]: v }), {});
}

@root("/v1")
class TodoResource {
  findById(id: number): Todo | undefined {
    const todo = EVENT_LIST.filter(it => it.id === id).reduce<Todo | undefined>((p, c) => {
      switch (c.type) {
        case "create":
          return { id: c.id, description: c.data.description, done: c.data.done };
        case "delete":
          return undefined;
        case "update":
          return { ...p, ...deleteNullish(c.data) } as Todo;
      }
    }, {} as Todo);
    return todo;
  }

  @post
  @path("/todos")
  postTodo(req: Request): Response {
    const currentId = ++id;
    EVENT_LIST.push({
      type: "create",
      id: currentId,
      data: {
        description: req.body.description,
        done: req.body.done,
      },
    });
    return new Response().status(201).body(this.findById(currentId));
  }

  @put
  @path("/todos/:id")
  putTodo(req: Request): Response {
    const id = parseInt(req.params.id, 10)
    return new Response().status(200).body(this.findById(id));
  }

  @get
  @path("/todos")
  getTodos(req: Request): Response {
    const ids = [...new Set(EVENT_LIST.map(it => it.id))];
    const todos = ids.map(it => this.findById(it)).filter(it => it != null);
    return new Response().status(200).body(todos);
  }

  @get
  @path("/todos/:id")
  getTodo(req: Request): Response {
    const id = parseInt(req.params.id, 10)
    return new Response().status(200).body(this.findById(id));
  }

  @customMethod("delete")
  @path("/todos/:id")
  deleteTodo(req: Request): Response {
    EVENT_LIST.push({ type: "delete", id: parseInt(req.params.id, 10) })
    return new Response().status(204).body({});
  }
}

listen(8080);
