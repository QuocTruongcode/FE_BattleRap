import { MainLayout } from '../components/layout';
import Ranking from '../components/Ranking/Ranking';
import './RankBattler.css';

export default function RankBattler() {
    return (
        <div className="rank-battler-page">
            <MainLayout>
                <Ranking />
            </MainLayout>
        </div>
    );
}