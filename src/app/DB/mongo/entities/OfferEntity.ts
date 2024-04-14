import IOffer, {TypeCity, TypeComfortable, TypeLocation, TypeOffer} from '../../../models/IOffer.ts';
import {defaultClasses, getModelForClass, modelOptions, prop, Ref} from '@typegoose/typegoose';
import {UserEntity} from './UserEntity.ts';

export interface OfferEntity extends defaultClasses.Base {}

@modelOptions({
  schemaOptions: {
    collection: 'offers',
    timestamps: true
  }
})

export class OfferEntity extends defaultClasses.TimeStamps implements IOffer {
  @prop({ type: () => String, required: true, trim: true })
  public name: string;

  @prop({type: String, required: true, trim: true, default: ''})
  public description: string;

  @prop({ type: () => String, required: true})
  public city: TypeCity;

  @prop({ type: () => String, required: true})
  public prevPicture: string;

  @prop({ type: () => [String], required: true, default: []})
  public images: string[];

  @prop({type: () => Boolean, required: true, default: false})
  public premium: boolean;

  @prop({type: () => Boolean, required: true, default: false})
  public favorite: boolean;

  @prop({type: () => Number, required: true, default: 5})
  public rating: number;

  @prop(({ type: () => String, required: true}))
  public type: TypeOffer;

  @prop(({ type: () => Number, required: true, default: 1}))
  public countRooms: number;

  @prop(({ type: () => Number, required: true, default: 1}))
  public countGuests: number;

  @prop(({ type: () => Number, required: true, default: 100}))
  public price: number;

  @prop(({ type: () => [String], required: true, default: []}))
  public comfortable: TypeComfortable[];

  @prop({ ref: UserEntity, required: true})
  public author: Ref<UserEntity>;

  @prop(({ type: () => Number, required: true, default: 0}))
  public countComments: number;

  @prop(({ type: () => String, required: true}))
  public location: TypeLocation;
}

export const OfferModel = getModelForClass(OfferEntity);