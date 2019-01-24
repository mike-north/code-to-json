import { createRef } from '@code-to-json/utils';
import { generateId } from '@code-to-json/utils-ts';
import { expect } from 'chai';
import { suite, test } from 'mocha-typescript';
import * as ts from 'typescript';
import { RefRegistry, SymbolRef } from '../../src';
import serializeSourceFile from '../../src/serializers/source-file';
import serializeSymbol from '../../src/serializers/symbol';
import { setupScenario } from './helpers';

@suite
export class SourceFileSerializtionTests {
  @test
  public async 'single-function, no exports'(): Promise<void> {
    const { checker, sf, collector } = setupScenario(
      `function add(a: number, b: number): number { return a + b; }
const x = add(4, 5);
console.log(x);`,
    );
    const [fnSym] = checker.getSymbolsInScope(sf, ts.SymbolFlags.Function);
    if (!fnSym) {
      throw new Error('Function has no symbol');
    }
    const [fnDecl] = fnSym.declarations;
    expect(fnDecl.getText()).to.eql('function add(a: number, b: number): number { return a + b; }');

    const sfRef = createRef<RefRegistry, 'sourceFile'>('sourceFile', generateId(sf));
    const serialized = serializeSourceFile(sf, checker, sfRef, collector);
    expect(serialized).to.deep.eq({
      entity: 'sourceFile',
      extension: 'ts',
      moduleName: 'temp-project/module',
      pathInPackage: 'module',
      originalFileName: 'module.ts',
      id: 'F01m4wncyo0ry',
      isDeclarationFile: false,
    });
  }

  @test
  public async 'single exported function'(): Promise<void> {
    const { checker, sf, collector } = setupScenario(
      `export function add(a: number, b: number): number { return a + b; }`,
    );
    const [fnSym] = checker.getSymbolsInScope(sf, ts.SymbolFlags.Function);
    if (!fnSym) {
      throw new Error('Function has no symbol');
    }
    const [fnDecl] = fnSym.declarations;
    expect(fnDecl.getText()).to.eql(
      'export function add(a: number, b: number): number { return a + b; }',
    );

    const sfRef = createRef<RefRegistry, 'sourceFile'>('sourceFile', generateId(sf));
    const serialized = serializeSourceFile(sf, checker, sfRef, collector);
    expect(serialized).to.deep.eq({
      entity: 'sourceFile',
      extension: 'ts',
      id: 'F01m4wncynxfl',
      isDeclarationFile: false,
      moduleName: 'temp-project/module',
      originalFileName: 'module.ts',
      pathInPackage: 'module',
      symbol: ['symbol', 'S01m4wm725rtw'],
    });

    const { symbols } = collector.queue.process({
      mapSymbol(_ref: SymbolRef, sym: ts.Symbol) {
        return sym;
      },
    });
    const { S01m4wm725rtw: fileSymbol } = symbols;
    expect(!!fileSymbol).to.eq(true);

    const serializedFileSymbol = serializeSymbol(
      fileSymbol,
      checker,
      createRef<RefRegistry, 'symbol'>('symbol', generateId(fileSymbol)),
      collector,
    );

    expect(serializedFileSymbol).to.deep.include({
      entity: 'symbol',
      flags: ['ValueModule'],
      id: 'S01m4wm725rtw',
      exports: { add: ['symbol', 'S01m4wlu6go0e'] },
      location: [['sourceFile', 'F01m4wncynxfl'], 1, 1, 1, 67],
      name: '"module"',
      sourceFile: ['sourceFile', 'F01m4wncynxfl'],
    });
    expect(serializedFileSymbol)
      .to.haveOwnProperty('type')
      .instanceOf(Array)
      .lengthOf(2);
  }
}
