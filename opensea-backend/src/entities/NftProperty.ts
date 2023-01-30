import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Nft } from './Nft';

@Entity()
export class NftProperty {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  propertyKey: string;

  @Column()
  value: string;

  @ManyToOne((type) => Nft, (nft) => nft.properties)
  nft: Nft;
}
