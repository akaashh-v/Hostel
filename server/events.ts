import { Response } from 'express';
import { RealtimeEvent } from '../src/types';

class RealtimeManager {
  private clients: Set<Response> = new Set();

  public addClient(res: Response) {
    this.clients.add(res);
    res.on('close', () => {
      this.clients.delete(res);
    });
  }

  public removeClient(res: Response) {
    this.clients.delete(res);
  }

  public broadcast(event: RealtimeEvent) {
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const client of this.clients) {
      try {
        client.write(data);
      } catch (err) {
        this.clients.delete(client);
      }
    }
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const realtimeManager = new RealtimeManager();
