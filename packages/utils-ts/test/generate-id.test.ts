import { getDeclarationFiles } from '@code-to-json/test-helpers';
import { expect } from 'chai';
import { suite, test } from 'mocha-typescript';
import * as ts from 'typescript';
import { generateIdForSourceFileName } from '../lib/src/generate-id';
import { createIdGenerator } from '../src/generate-id';
import { createProgramFromCodeString, mapDict } from '../src/index';

@suite
export class GenerateIdTests {
  private sourceFile!: ts.SourceFile;

  private classDeclaration!: ts.Declaration;

  private varDeclaration!: ts.Declaration;

  private typ!: ts.Type;

  private sourceFileSym!: ts.Symbol;

  private classSym!: ts.Symbol;

  private varSym!: ts.Symbol;

  private checker!: ts.TypeChecker;

  public before() {
    const { program } = createProgramFromCodeString(
      `
export class Car {
  public wheels: number = 4;
  constructor() {
    console.log('We are driving');
  }
}
export const x: string = 'foo';
`,
      'ts',
    );
    const { nonDeclarationFiles } = getDeclarationFiles(program.getSourceFiles());
    [this.sourceFile] = nonDeclarationFiles;
    const checker = program.getTypeChecker();

    const sym = checker.getSymbolAtLocation(this.sourceFile);
    if (!sym) {
      throw new Error('no symbol for SourceFile');
    }
    this.sourceFileSym = sym;
    this.typ = checker.getTypeOfSymbolAtLocation(this.sourceFileSym, this.sourceFile);

    const { exports: fileExports } = this.sourceFileSym;
    if (!fileExports) {
      throw new Error('File has no exports');
    }
    const exportedSymbols: ts.Symbol[] = [];
    const it = fileExports.values();
    let itV = it.next();
    while (!itV.done) {
      exportedSymbols.push(itV.value);
      itV = it.next();
    }
    expect(exportedSymbols.length).to.eql(2);
    [this.classSym, this.varSym] = exportedSymbols;
    expect(this.classSym.declarations.length).to.eql(1);
    [this.classDeclaration] = this.classSym.declarations;

    expect(this.varSym.declarations.length).to.eql(1);
    [this.varDeclaration] = this.varSym.declarations;
    this.checker = checker;
  }

  @test
  public async 'generateId for sourceFile'(): Promise<void> {
    const generateId = createIdGenerator(this.checker);
    expect(generateId(this.sourceFile)).to.eql(['ok', 'F01m4wnf2ptes']);
  }

  @test
  public async 'generateId for symbol'(): Promise<void> {
    const generateId = createIdGenerator(this.checker);
    expect(generateId(this.sourceFileSym)[1])
      .to.be.a('string')
      .and.to.have.lengthOf(13);
  }

  @test
  public async 'generateId for type'(): Promise<void> {
    const generateId = createIdGenerator(this.checker);
    expect(generateId(this.typ)[1])
      .to.be.a('string')
      .and.to.have.length.greaterThan(0);
  }

  @test
  public async 'generateId for class declaration'(): Promise<void> {
    const generateId = createIdGenerator(this.checker);
    expect(generateId(this.classDeclaration)[1])
      .to.be.a('string')
      .and.to.have.lengthOf(13);
  }

  @test
  public async 'generateId for variable declaration'(): Promise<void> {
    const generateId = createIdGenerator(this.checker);
    expect(generateId(this.varDeclaration)[1])
      .to.be.a('string')
      .and.to.have.lengthOf(13);
  }

  @test
  public async 'generateId for class members and their children'(): Promise<void> {
    const generateId = createIdGenerator(this.checker);

    const { members } = this.classSym;
    if (!members) {
      throw new Error('No members in class');
    }
    const memberSyms = mapDict(members, s => s);
    const memberSym = memberSyms[Object.keys(memberSyms)[0]];
    if (!memberSym) {
      throw new Error('Expected to find at least one member symbol');
    }
    const [memberDecl] = memberSym.declarations;
    expect(memberDecl.getText()).to.eql('public wheels: number = 4;');
    expect(generateId(memberDecl)[1])
      .to.be.a('string')
      .and.to.have.lengthOf(13);
    ts.forEachChild(memberDecl, ch => {
      expect(generateId(ch)[1])
        .to.be.a('string')
        .and.to.have.lengthOf(13);
    });
  }

  @test
  public 'sourceFile IDs are insulated from path differences betwen POSIX and Windows'() {
    expect(
      generateIdForSourceFileName(
        'C:/Users/VSSADM~1/AppData/Local/Temp/tmp-8S4881UXySQ6x/src/index',
      ),
    ).to.eql('01m4wmj9uhye', 'Windows-style filenames');
    expect(
      generateIdForSourceFileName(
        'C:/Users/VSSADM~1/AppData/Local/Temp/tmp-8S4881UXySQ6x/src/index"',
      ),
    ).to.eql('01m4wmj9uhye', 'Windows-style filenames with quotes');
    expect(
      generateIdForSourceFileName('/Users/VSSADM~1/AppData/Local/Temp/tmp-8S4881UXySQ6x/src/index'),
    ).to.eql('01m4wmj9uhye', 'POSIX-style filenames');
  }

  @test
  public async 'generateId for null'(): Promise<void> {
    const generateId = createIdGenerator(this.checker);

    expect(() => generateId(null as any)).to.throw('Cannot generate an ID for empty values');
  }

  @test
  public async 'generateId for undefined'(): Promise<void> {
    const generateId = createIdGenerator(this.checker);

    expect(() => generateId(undefined as any)).to.throw('Cannot generate an ID for empty values');
  }

  @test
  public async 'generateId for 8'(): Promise<void> {
    const generateId = createIdGenerator(this.checker);

    expect(() => generateId(8 as any)).to.throw('Cannot generate an id for this object');
  }

  @test
  public 'stable hashing'(): void {
    const generateId = createIdGenerator(this.checker);

    expect(generateId(this.classDeclaration)).to.eql(['ok', 'D01m4wm4wrlxj'], 'class declaration');
    expect(generateId(this.classSym)).to.eql(['ok', 'S01m4wntwmh9a'], 'class symbol');
    expect(generateId(this.varSym)).to.eql(['ok', 'S01m4wmqaygbn'], 'variable symbol');
    expect(generateId(this.varDeclaration)).to.eql(['ok', 'D01m4wlurlp4f'], 'variable declaration');
    expect(generateId(this.typ)).to.eql(['ok', 'T01m4wmnuc0f2'], 'type');
    expect(generateId(this.sourceFile)).to.eql(['ok', 'F01m4wnf2ptes'], 'source file');
  }
}
