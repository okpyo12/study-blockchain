import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class NftContract {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contractAddress: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'mediumtext', nullable: true })
  description: string;

  @Column({ type: 'mediumtext', nullable: true })
  image: string;

  @Column()
  symbol: string;

  @Column()
  totalSupply: string;

  @Column()
  synced: boolean;
}
