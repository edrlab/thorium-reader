import { Container } from "inversify";
import { Translator } from "../../src/common/services/translator";
import { diSymbolTable } from "../../src/main/diSymbolTable";
const container = new Container();
container.bind<Translator>(diSymbolTable.translator).to(Translator).inSingletonScope();
interface IGet {
    (s: "translator"): Translator;
    (s: keyof typeof diSymbolTable): any;
}
const diGet: IGet = (symbol: keyof typeof diSymbolTable) => container.get<any>(diSymbolTable[symbol]);
export {
    diGet as diMainGet,
};
