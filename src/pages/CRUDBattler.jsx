import { MainLayout } from '../components/layout';
import BattlerTag from '../components/battler/BattlerTag';
import BattlerForm from '../components/battler/BattlerForm';
import './CRUDBattler.css';

export default function CRUDBattler() {
    return (
        <div className="crud-battler-page">
            <MainLayout>
                <div className="crud-battler-page__content">
                    {/* <BattlerTag
                        title="Chúng Ta Của Hiện Tại"
                        type="Single"
                        artist="Sơn Tùng M-TP"
                        meta="2020 • 1 song, 5 min 1 sec"
                    /> */}

                    <div className="crud-battler-page__form-wrap">
                        <BattlerForm />
                    </div>
                </div>
            </MainLayout>
        </div>
    );
}
