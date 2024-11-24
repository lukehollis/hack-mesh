import DelphiTemple from '../spaceCustom/DelphiTemple';
import ArtOfIntimidation from './ArtOfIntimidation';
import YishunSafra from './YishunSafra';

import Store from '../../Store';


const tours = {
    delphi: DelphiTemple,
    artOfIntimidation: ArtOfIntimidation,
    yishunSafra: YishunSafra,
}

const setupSpaceCustom = () => {

    const { space } = Store.getState();
    if (tours[space.data.space_custom]) {
        return new tours[space.data.space_custom]();
    }
    
    return null;
}

export default setupSpaceCustom;