import type { Dispatch, SetStateAction } from 'react';
import type { Node, Edge } from '@xyflow/react';
import type { Command } from './command';
import { deserializeCommand } from './command';

export interface SerializedCaretaker {
  commands: any[];  // массив JSON-описаний команд
  index: number;    // текущая позиция в стеке (0-based)
}

export class Caretaker {
  private commands: Command[] = [];
  private index = -1;

  /** Добавить и сразу выполнить новую команду */
  public executeCommand(cmd: Command) {
    // “обрезаем” все будущие команды
    this.commands.splice(this.index + 1);
    cmd.execute();
    this.commands.push(cmd);
    this.index++;
  }

  /** Отменить последнюю команду (если есть) */
  public undo() {
    if (this.index < 0) return;
    this.commands[this.index].undo();
    this.index--;
  }

  /** Повторить команду, отменённую через undo */
  public redo() {
    if (this.index >= this.commands.length - 1) return;
    this.index++;
    this.commands[this.index].execute();
  }

  /** Экспортировать чистую историю команд */
  public export(): SerializedCaretaker {
    return {
      commands: this.commands.map((c) => c.serialize()),
      index: this.index,
    };
  }

  /**
   * Импортировать историю команд (без состояния)
   * @param payload.commands — JSON-описания команд
   * @param payload.index    — до какой команды их надо будет применить
   * @param payload
   * @param setNodes
   * @param setEdges
   */
  public import(
    payload: SerializedCaretaker,
    setNodes: Dispatch<SetStateAction<Node[]>>,
    setEdges: Dispatch<SetStateAction<Edge[]>>
  ) {
    this.commands = payload.commands.map((raw) =>
      deserializeCommand(raw, setNodes, setEdges)
    );
    this.index = payload.index;

    for (let i = 0; i <= this.index; i++) {
      this.commands[i].execute();
    }
  }
}
