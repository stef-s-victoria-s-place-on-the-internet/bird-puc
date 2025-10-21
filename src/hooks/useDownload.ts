import { useState, useRef, useCallback } from 'react';
import { format, startOfDay, endOfDay } from 'date-fns';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { graphqlClient, DETECTIONS_QUERY } from '../api/graphql';
import { DetectionsResponse, Detection, FilterState } from '../types';
import { formatDateForAPI } from '../utils/formatters';

interface UseDownloadOptions {
  selectedDate: Date;
  filters: FilterState;
  totalCount: number;
  getAudioUrl: (url: string) => string;
}

interface UseDownloadReturn {
  isDownloading: boolean;
  downloadProgress: { current: number; total: number };
  handleDownloadAll: () => Promise<void>;
  handleCancelDownload: () => void;
}

export function useDownload({
  selectedDate,
  filters,
  totalCount,
  getAudioUrl
}: UseDownloadOptions): UseDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const downloadCancelledRef = useRef(false);

  const handleDownloadAll = useCallback(async () => {
    if (filters.stationIds.length === 0) {
      alert('Please select at least one station to download detections.');
      return;
    }
    
    if (totalCount === 0) return;
    
    downloadCancelledRef.current = false;
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: 0 });

    try {
      // First, fetch ALL detections (not just the displayed ones)
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);

      interface QueryVariables {
        period: {
          from: string;
          to: string;
        };
        first: number;
        stationIds: string[];
      }

      const variables: QueryVariables = {
        period: {
          from: formatDateForAPI(start),
          to: formatDateForAPI(end),
        },
        first: 10000, // Fetch up to 10,000 detections for download
        stationIds: filters.stationIds,
      };

      // Fetch all detections for download
      const data = await graphqlClient.request<DetectionsResponse>(
        DETECTIONS_QUERY,
        variables
      );

      const allDetections = data.detections.nodes;
      
      const zip = new JSZip();
      
      // Group detections by species
      const detectionsBySpecies = allDetections.reduce((acc, detection) => {
        const speciesName = detection.species.commonName;
        if (!acc[speciesName]) {
          acc[speciesName] = [];
        }
        acc[speciesName].push(detection);
        return acc;
      }, {} as Record<string, Detection[]>);

      // Count total files to download
      const totalFiles = allDetections.filter(d => d.soundscape?.id).length;
      setDownloadProgress({ current: 0, total: totalFiles });

      let downloadedCount = 0;

      // Download and add files to zip, organized by species
      for (const [speciesName, speciesDetections] of Object.entries(detectionsBySpecies)) {
        // Check if download was cancelled
        if (downloadCancelledRef.current) {
          console.log('Download cancelled by user');
          break;
        }

        // Create a safe folder name
        const folderName = speciesName.replace(/[^a-z0-9]/gi, '_');
        const speciesFolder = zip.folder(folderName);

        if (speciesFolder) {
          for (const detection of speciesDetections) {
            // Check if download was cancelled
            if (downloadCancelledRef.current) {
              console.log('Download cancelled by user');
              break;
            }

            if (detection.soundscape?.id) {
              try {
                // Fetch the audio file using normalized URL
                const audioUrl = getAudioUrl(detection.soundscape.url);
                const response = await fetch(audioUrl);
                const blob = await response.blob();
                
                // Use the download filename from API or create a descriptive one
                const fileName = detection.soundscape.downloadFilename || 
                  `${format(new Date(detection.timestamp), 'yyyy-MM-dd_HH-mm-ss')}_${(detection.confidence * 100).toFixed(0)}pct.mp3`;
                
                // Add file to species folder
                speciesFolder.file(fileName, blob);
                
                downloadedCount++;
                setDownloadProgress({ current: downloadedCount, total: totalFiles });
              } catch (err) {
                console.error(`Failed to download ${detection.id}:`, err);
              }
            }
          }
        }
      }

      // Generate and download the zip file only if not cancelled
      if (!downloadCancelledRef.current) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const fileName = filters.stationIds.length > 0 
          ? `birdweather_${dateStr}_filtered.zip`
          : `birdweather_${dateStr}.zip`;
        
        saveAs(zipBlob, fileName);
      }
      
    } catch (err) {
      console.error('Error creating download:', err);
      if (!downloadCancelledRef.current) {
        alert('Failed to create download. Please try again.');
      }
    } finally {
      setIsDownloading(false);
      setDownloadProgress({ current: 0, total: 0 });
      downloadCancelledRef.current = false;
    }
  }, [selectedDate, filters, totalCount, getAudioUrl]);

  const handleCancelDownload = useCallback(() => {
    downloadCancelledRef.current = true;
  }, []);

  return {
    isDownloading,
    downloadProgress,
    handleDownloadAll,
    handleCancelDownload
  };
}

