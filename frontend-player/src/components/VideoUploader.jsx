// frontend-player/src/components/VideoUploader.jsx
import React, { useState, useRef } from 'react';
import api from '../utils/api';

// PERHATIKAN BARIS INI: Wajib menggunakan "export default"
export default function VideoUploader({ onUploadSuccess, category = 'general' }) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) processUpload(files[0]);
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) processUpload(files[0]);
    };

    const processUpload = async (file) => {
        if (!file.type.startsWith('video/')) {
            alert('❌ Penolakan Sistem: File harus berupa format video (MP4, WebM, dll)');
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);

        try {
            const response = await api.post('/assets', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                }
            });
            
            onUploadSuccess(response.data.data);
            setProgress(0);
        } catch (error) {
            // PERBAIKAN: Menangkap log asli dari Laravel
            const serverMsg = error.response?.data?.message || 'Tidak ada pesan spesifik';
            const exceptionName = error.response?.data?.exception || '';
            const dbError = error.response?.data?.error || ''; // Menangkap custom error dari controller
            
            console.error('DIAGNOSTIK ERROR SERVER:', error.response?.data);
            
            alert(`🚨 TERJADI ERROR 500 DI LARAVEL:\n\nPesan: ${serverMsg}\nException: ${exceptionName}\nDB Error: ${dbError}\n\nSilakan buka terminal (php artisan serve) untuk melihat log merah secara lengkap.`);
        } finally {
            setIsUploading(false);
        }
    };

    const dropzoneStyle = {
        border: isDragging ? '2px dashed #2563eb' : '2px dashed #d1d5db',
        backgroundColor: isDragging ? '#eff6ff' : '#f9fafb',
        padding: '15px', 
        textAlign: 'center', 
        borderRadius: '8px', 
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginTop: '10px'
    };

    return (
        <div 
            style={dropzoneStyle} 
            onDragOver={handleDragOver} 
            onDragLeave={handleDragLeave} 
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current.click()}
        >
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileSelect} 
                accept="video/*" 
                style={{ display: 'none' }} 
            />
            
            {isUploading ? (
                <div style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '13px' }}>
                    ⏳ Mengunggah... {progress}%
                    <div style={{ width: '100%', backgroundColor: '#e5e7eb', height: '6px', borderRadius: '3px', marginTop: '8px' }}>
                        <div style={{ width: `${progress}%`, backgroundColor: '#2563eb', height: '100%', borderRadius: '3px', transition: 'width 0.2s' }} />
                    </div>
                </div>
            ) : (
                <div style={{ color: '#6b7280', fontSize: '13px' }}>
                    <span style={{ fontSize: '20px', display: 'block', marginBottom: '5px' }}>📥</span>
                    <strong>Drag & Drop</strong> video ke sini, atau <strong>Klik</strong> untuk memilih
                </div>
            )}
        </div>
    );
}