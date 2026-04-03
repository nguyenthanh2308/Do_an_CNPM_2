import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Interfaces khớp với Payload ở Backend */
export interface RoomStatusChangedEvent {
  roomId: number;
  roomNumber: string;
  floor: number;
  hotelId: number;
  oldStatus: string;
  newStatus: string;
  changedAt: string;
  changedBy?: string;
  notes?: string;
}

export interface NewHousekeepingTaskEvent {
  taskId: number;
  roomId: number;
  roomNumber: string;
  floor: number;
  taskType: string;
  priority: string;
  notes?: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;

  // RxJS Subjects để Component subscribe
  public roomStatusChanged$ = new Subject<RoomStatusChangedEvent>();
  public newHousekeepingTask$ = new Subject<NewHousekeepingTaskEvent>();

  constructor(private authService: AuthService) {}

  public startConnection(): void {
    if (this.hubConnection && this.hubConnection.state === signalR.HubConnectionState.Connected) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace('/api', '')}/hubs/room`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.hubConnection.start()
      .then(() => {
        console.log('SignalR Connected to RoomHub');
        this.addListeners();
      })
      .catch(err => console.error('Error while starting connection: ' + err));
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection.stop().then(() => console.log('SignalR Disconnected'));
    }
  }

  private addListeners(): void {
    if (!this.hubConnection) return;

    // Lắng nghe event Cập nhật trạng thái phòng
    this.hubConnection.on('RoomStatusChanged', (data: RoomStatusChangedEvent) => {
      console.log('SignalR received: RoomStatusChanged', data);
      this.roomStatusChanged$.next(data);
    });

    // Lắng nghe event Có task Housekeeping mới
    this.hubConnection.on('NewHousekeepingTask', (data: NewHousekeepingTaskEvent) => {
      console.log('SignalR received: NewHousekeepingTask', data);
      this.newHousekeepingTask$.next(data);
    });
  }
}
