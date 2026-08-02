import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import './Graph.css';


export default function Graph({ video, barSelected }) {
    return (
        console.log("Check video in Graph component:", video),
        console.log("Check bar selected in Graph component:", barSelected),
        <div className="graph-container">
            <div className="graph-header">
                <h2>{video?.title || 'Biểu đồ tri thức từng bar'}</h2>
            </div>
        </div>
    );
}
