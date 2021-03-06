import { mount, createWrapper } from '@vue/test-utils';
import { getByText as getByTextHelper } from '@testing-library/dom';
import { invite as member } from '../mock_data';
import InviteAvatar from '~/vue_shared/components/members/avatars/invite_avatar.vue';

describe('MemberList', () => {
  let wrapper;

  const { invite } = member;

  const createComponent = (propsData = {}) => {
    wrapper = mount(InviteAvatar, {
      propsData: {
        member,
        ...propsData,
      },
    });
  };

  const getByText = (text, options) =>
    createWrapper(getByTextHelper(wrapper.element, text, options));

  beforeEach(() => {
    createComponent();
  });

  afterEach(() => {
    wrapper.destroy();
  });

  it('renders email as name', () => {
    expect(getByText(invite.email).exists()).toBe(true);
  });

  it('renders avatar', () => {
    expect(wrapper.find('img').attributes('src')).toBe(invite.avatarUrl);
  });
});
