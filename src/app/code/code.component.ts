import { Component, ElementRef, HostListener } from '@angular/core';

import { CodeService } from '../code.service';

class CodeUnit {
  char: string
  condition: boolean
  line: number
  index: number

  constructor(char: string, condition: boolean, line: number, index: number) {
    this.char = char
    this.condition = condition
    this.line = line
    this.index = index
  }

  isSpace(): boolean {
    return this.char === ' '
  }

  isNotNewline(): boolean {
    return this.char !== 'Enter'
  }
}

class Position {
  line: number = 0
  index: number = 0
}

class CodeRender {
  start: number = 0
  length: number = 0

  constructor(start: number, length: number) {
    this.start = start
    this.length = length

    //console.log(`New range ${start} ${length}`)
  }

  range(manager: CodeManager, view: boolean): CodeLine[] {
    let lines = []
    for (let index = this.start; index < this.length; index ++) {
      if (!view && manager.position.line === index) {
        if (manager.position.index > 0) {
          lines.push(new CodeLine(index, manager.code[index].slice(0, manager.position.index)))
        }
        break
      } else {
        lines.push(new CodeLine(index, manager.code[index]))
      }
    }

    return lines
  }
}

class CodeLine {
  lineNum: number
  units: CodeUnit[]

  constructor(lineNum: number, units: CodeUnit[]) {
    this.lineNum = lineNum
    this.units = units
  }
}

class CodeManager {
  code: CodeUnit[][] = [[new CodeUnit('Enter', false, 0, 0)]]
  position: Position = new Position()
  failure: CodeUnit[] = []

  constructor(code: CodeUnit[][]) {
    this.code = code
  }

  asString(): string {
    return `${this.position.line} ${this.position.index} ${this.code[this.position.line][this.position.index]}`
  }

  getPreviousUnit(): CodeUnit {
    let line = this.position.line
    let index = this.position.index

    if (index === 0) {
      line -= 1
      index = this.code[line].length - 1
    }

    return this.code[line][index]
  }

  getCurrentUnit(): CodeUnit {
    return this.code[this.position.line][this.position.index]
  }

  isCurrentUnit(codeUnit: CodeUnit): boolean {
    return codeUnit.line === this.position.line && codeUnit.index === this.position.index
  }

  islastLine(line: CodeLine): boolean {
    return line.lineNum == this.position.line
  }

  add(char: string): void {
    let codeUnit = this.getCurrentUnit()

    if (this.failure.length === 0 && codeUnit.char === char) {
      codeUnit.condition = true
      this.position.index++
      if (this.position.index === this.code[this.position.line].length) {
        this.position.line += 1
        this.position.index = 0
      }
    } else {
      this.failure.push(new CodeUnit(char, false, 0, this.failure.length))
    }
  }

  delete(): void {
    if (this.failure.length > 0) {
      this.failure = this.failure.slice(0, this.failure.length - 1)
    }
    else if (this.position.line > 0 || this.position.index > 0) {
        if (this.position.index === 0) {
        this.position.line -= 1
        this.position.index = this.code[this.position.line].length - 1
      } else {
        this.position.index -= 1
      }


      let codeUnit = this.getCurrentUnit()
      codeUnit.condition = false
    }

    //console.log(this.position.index)
  }

  getCodeRenderUnits(study: boolean): CodeLine[] {
    let start, length: number

    if (this.position.line === 0) {
      start = this.position.line
    } else {
      start = this.position.line - 1
    }

    length = 10

    while (length >= this.code.length) {
      length -= 1
    }

    return new CodeRender(start, length).range(this, study)
  }
}

@Component({
  selector: 'app-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.css']
})

export class CodeComponent {
  manager: CodeManager = new CodeManager([])
  value: string = ""

  constructor(private codeService: CodeService, private elementRef: ElementRef) { }

  getCode(): void {
    this.codeService.getCode().subscribe(code => {
      console.log(code)
      let codeSplit = code.split(/\r{0,1}\n/);

      let unmanagedCode: CodeUnit[][] = []
      for (let lineNum = 0; lineNum < codeSplit.length; lineNum++) {
        let codeUnits: CodeUnit[] = []
        let index = 0
        for (; index < codeSplit[lineNum].length; index++) {
          codeUnits.push(new CodeUnit(codeSplit[lineNum][index], false, lineNum, index))
        }

        codeUnits.push(new CodeUnit('Enter', false, lineNum, index + 1))

        unmanagedCode.push(codeUnits)
      }

      console.log(unmanagedCode)

      this.manager = new CodeManager(unmanagedCode)
    })
  }

  ngOnInit(): void {
    this.getCode()
  }

  isNewline(line: CodeLine): boolean {
    return line.units[0].char === 'Enter'
  }

  /*
  getVisibleCode(line: number): CodeUnit[][] {
    let breakdown: CodeUnit[] = []

    for (let index = 0; index < this.code[line].length; index++) {
      let completed
      if (line < this.line) {
        completed = true
      } else if (line === this.line && index < this.position) {
        completed = true
      } else {
        completed = false
      }

      let breakdownUnit = new BreakdownUnit(this.code[line][index], completed)
      breakdown.push(breakdownUnit)
    }

    return breakdown
  }
  */

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    if (event.key === 'Shift' || event.key === 'Control' || event.key === 'Alt') {
      console.log(`Ignore key ${event.key}`)
      return
    }

    if (event.key === 'Backspace') {
      this.manager.delete()
    } else {
      this.manager.add(event.key)
    }
  }
}
