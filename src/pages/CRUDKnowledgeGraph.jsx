import { useState } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';

export default function CRUDKnowledgeGraph() {
    const navigate = useNavigate();

    return (
        <Header></Header>
    );
}
