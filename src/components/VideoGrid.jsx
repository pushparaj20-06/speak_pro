import { useTracks, VideoTrack, ParticipantName } from '@livekit/components-react';
import { Track } from 'livekit-client';

export default function VideoGrid() {
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], { onlySubscribed: false });
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 w-full max-w-7xl mx-auto h-[80vh]">
      {tracks.map((trackRef, index) => (
        <div key={index} className="relative glass-panel rounded-2xl overflow-hidden aspect-video shadow-2xl ring-1 ring-white/10 group">
          <VideoTrack trackRef={trackRef} className="w-full h-full object-cover" />
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
            <ParticipantName participant={trackRef.participant} className="text-white text-sm font-medium" />
          </div>
        </div>
      ))}

    </div>
  );
}
