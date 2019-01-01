import { expect } from 'chai';
import { suite, test } from 'mocha-typescript';
import * as ts from 'typescript';
import { isDeclarationExported, mapUem, transpileCodeString } from '../src/index';

@suite('Checks tests')
class ChecksTests {
  private sf!: ts.SourceFile;

  private sfSym!: ts.Symbol;

  private checker!: ts.TypeChecker;

  public before() {
    const code = `export class Foo { bar: string; };
let x: number = 4;
function addToX(y: number): number { return x + y; }`;
    const out = transpileCodeString(code, 'ts');
    const p = out.program;
    const sf = p.getSourceFile('module.ts');
    if (!sf) {
      throw new Error('No source file module.ts found');
    }
    this.sf = sf;
    this.checker = p.getTypeChecker();
    const sfSym = this.checker.getSymbolAtLocation(this.sf);
    if (!sfSym) {
      throw new Error('SourceFile has no symbol');
    }
    this.sfSym = sfSym;
  }

  @test
  public isDeclarationExported(): void {
    expect(isDeclarationExported(this.sf)).to.eql(
      false,
      'SourceFile is not an exported declaration',
    );
    const { exports } = this.sfSym;
    if (!exports) {
      throw new Error('SourceFile has no exports');
    }
    if (!exports) {
      throw new Error('SourceFile has no exports');
    }
    const exportArr = mapUem(exports, sym => sym.declarations[0]);
    expect(exportArr.length).to.eql(1);

    expect(this.sf.statements.length).to.eql(4);
    expect(this.sf.statements[3].getText()).to.eql(
      'function addToX(y: number): number { return x + y; }',
    );
    expect(isDeclarationExported(exportArr[0])).to.eq(true);
  }
}